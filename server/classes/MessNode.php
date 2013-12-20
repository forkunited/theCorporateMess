<?php
/**
 * Copyright 2013 Bill McDowell 
 *
 * This file is part of theMess (https://github.com/forkunited/theMess)
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy 
 * of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software 
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT 
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the 
 * License for the specific language governing permissions and limitations 
 * under the License.
 */

require_once("phar://lib/neo4jphp.phar");
require_once("MessTag.php");
require_once("MessObject.php");

use Everyman\Neo4j\Client,
	Everyman\Neo4j\Index\NodeIndex,
	Everyman\Neo4j\Index\NodeFulltextIndex,
	Everyman\Neo4j\Node,
	Everyman\Neo4j\Relationship,
	Everyman\Neo4j\Cypher\Query;

class MessNode extends MessObject
{
	private $__user;	
	private $__readAccess;
	private $__writeAccess;
	private $__cachedNeo4jNode;

	private $_updatedDate;
	private $_deleted;
	
	private $id;
	private $brief;
	private $thorough;
	private $posX;
	private $posY;
	private $main;
	
	private $tag;
	
	public function __construct(User $user, $id, MessTag $tag = null, $brief="", $thorough="", $posX = 0, $posY = 0, $main = false, $readAccess = null, $writeAccess = null)
	{
		$this->id = $id;
		$this->brief = $brief;
		$this->thorough = $thorough;
		$this->posX = $posX;
		$this->posY = $posY;
		$this->main = $main;
		
		$this->tag = $tag;

		$this->__client = null;
		$this->__user = $user;
		
		$this->__readAccess = $readAccess;
		$this->__writeAccess = $writeAccess;
	}
	
	public function __get($var)
	{
		return $this->{$var};
	}
	
	public function __set($var, $value)
	{
		$this->{$var} = $value;
	}
	
	public static function create(User $user, MessTag $tag, $brief="", $thorough="", $posX = 0, $posY = 0, $main = false, MessTransaction $transaction = null)
	{	
		$retNode = null;
		$client = null;
		try
		{	
			$clientProvided = true;
			if ($transaction == null)
			{
				$client = new Client();
				$client->startBatch();
				$clientProvided = false;
			} 
			else 
			{
				$client = $transaction->getClient();
			}
			
			/* Create mess node, relate it to tag, and add it to indices */
			$id = $tag->getNextNodeId();
			if ($id == null)
				return null;
			
			$exactNodeIndex = new NodeIndex($client, 'exactNode');
			$fulltextNodeIndex = new NodeFulltextIndex($client, 'fulltextNode');
			
			$messNode = $client->makeNode();
			$messNode->setProperty('type', 'MessNode');
			$messNode->setProperty('id', $id);
			$messNode->setProperty('brief', $brief);
			$messNode->setProperty('thorough', $thorough);
			$messNode->setProperty('posX', $posX);
			$messNode->setProperty('posY', $posY);
			$messNode->setProperty('main', $main);
			$messNode->setProperty('_deleted', false);
			$messNode->setProperty('_updatedDate', time());

			$client->saveNode($messNode);
			$client->addToIndex($exactNodeIndex, $messNode, 'id', $id);
			$client->addToIndex($fulltextNodeIndex, $messNode, 'brief', $brief);
			$client->addToIndex($fulltextNodeIndex, $messNode, 'thorough', $thorough);
			
			$retNode = new MessNode($user, $id, $tag, $brief, $thorough, $posX, $posY, $main, true, true);
			$retNode->__cachedNeo4jNode = $messNode;
			
			$retNode->setTransaction($transaction);
			if (!$retNode->saveTag($client, $messNode, false, true))
				return null;
			
			if (!$clientProvided)
				if (!$client->commitBatch())
					return null;
		}
		catch (Exception $e)
		{
			return null;
		}
		
		/* Return node */
		return $retNode;
	}
	
	public function retrieve()
	{
		/* HACK: Skip to save time 
		if (!$this->hasReadAccess())
			return false;
		*/
	
		try
		{
			$nodeIndex = new NodeIndex(new Client(), 'exactNode');
			$messNode = $nodeIndex->findOne('id', $this->id);
			if (is_null($messNode) || $messNode->getProperty('_deleted') == true)
				return false;
			
			$this->brief = $messNode->getProperty('brief');
			$this->thorough = $messNode->getProperty('thorough');
			$this->posX = $messNode->getProperty('posX');
			$this->posY = $messNode->getProperty('posY');
			$this->main = $messNode->getProperty('main');
			
			$this->_updatedDate = $messNode->getProperty('_updatedDate');
			$this->_deleted = $messNode->getProperty('_deleted');
			
			/* FIXME: Do this through Cypher to speed up */
			$tagRelation = $messNode->getFirstRelationship(array('TAG_TAGGED_NODE'));
			$this->tag = new MessTag($this->__user, $tagRelation->getStartNode()->getProperty('id'));
		}
		catch (Exception $e)
		{
			return false;
		}
		
		return true;
	}
	
	public function delete()
	{
		if (!$this->hasWriteAccess())
			return false;
			
		try
		{	
			$client = $this->clientBegin();
			
			$exactNodeIndex = new NodeIndex($client, 'exactNode');
			$fulltextNodeIndex = new NodeFulltextIndex($client, 'fulltextNode');
			$messNode = $exactNodeIndex->findOne('id', $this->id);
			
			$client->removeFromIndex($exactNodeIndex, $messNode);
			$client->removeFromIndex($fulltextNodeIndex, $messNode);
			
			$messNode->setProperty('_deleted', true);
			$messNode->setProperty('_updatedDate', time());
			
			$client->saveNode($messNode);
			if (!$this->saveTag($client, $messNode, true))
				return false;
			
			return $this->clientEnd($client);
		}
		catch (Exception $e)
		{
			return false;
		}
	}
	
	public function update()
	{
		/* Note that this will not update a tag relationship */
		if (!$this->hasWriteAccess())
			return false;
			
		try
		{
			$client = $this->clientBegin();
			
			$exactNodeIndex = new NodeIndex($client, 'exactNode');
			$fulltextNodeIndex = new NodeFulltextIndex($client, 'fulltextNode');
			$messNode = $exactNodeIndex->findOne('id', $this->id);
			
			$client->removeFromIndex($fulltextNodeIndex, $messNode);
			$client->addToIndex($fulltextNodeIndex, $messNode, 'brief', $this->brief);
			$client->addToIndex($fulltextNodeIndex, $messNode, 'thorough', $this->thorough);
			
			$messNode->setProperty('id', $this->id);
			$messNode->setProperty('brief', $this->brief);
			$messNode->setProperty('thorough', $this->thorough);
			$messNode->setProperty('posX', $this->posX);
			$messNode->setProperty('posY', $this->posY);
			$messNode->setProperty('main', $this->main);
			$messNode->setProperty('_updatedDate', time());
			
			$client->saveNode($messNode);
			if (!$this->saveTag($client, $messNode))
				return false;
			
			return $this->clientEnd($client);
		}
		catch (Exception $e)
		{
			return false;
		}
	
		return true;
	}
	
	private function saveTag($client, $messNode, $delete = false, $create = false) {
		$tagId = null;
		if ($this->tag != null) {
			$tagId = $this->tag->id;
		} else {
			$tagId = $messNode->getFirstRelationship(array('TAG_TAGGED_NODE'))->getStartNode()->getProperty('id');
		}
		
		if ($this->__transaction != null) {
			$this->tag = $this->__transaction->getTag($this->__user, $tagId);
		} elseif ($this->tag == null) {
			$this->tag = new MessTag($this->__user, $tagId);
			$this->tag->setClient($client);
		}
		
		if (!$this->tag->__retrieved)
			if (!$this->tag->retrieve())
				return false;
		
		if ($delete) {
			// Note that this is not thread-safe
			$this->tag->_deletionsSinceCompaction++;
			$this->tag->_nodeCount--;
		} else if ($create) {
			$this->tag->_nodeCount++;
			$this->tag->_nodeIdIterator++;
		
			$tagIndex = new NodeIndex($client, 'exactTag');
			$tagNode = $tagIndex->findOne('id', $this->tag->id);
			$tagMessRelationship = $tagNode->relateTo($messNode, 'TAG_TAGGED_NODE');
			$client->saveRelationship($tagMessRelationship);
		} 

		$this->tag->_updatedDate = time();
		return $this->tag->update();
	}
	
	public function hasWriteAccess()
	{
		return true; /* HACK: speed up
	
		if ($this->__writeAccess != null)
			return $this->__writeAccess;
	
		try
		{*/
			/* Check to see if the user created the tag for the node */
		/*	$query = new Query(new Client(), "START u=node:exactUser(id={userId}), n=node:exactNode(id={nodeId}) " .
										"MATCH (u)-[:USER_CREATED_TAG]->(t)-[:TAG_TAGGED_NODE]->(n) " .
										"RETURN t",
										array( 'userId' => $this->__user->id,		
											   'nodeId' => $this->id 
											 )
								);
			$this->__writeAccess = $query->getResultSet()->count() > 0;
			return $this->__writeAccess;
		}
		catch(Exception $e)
		{
			$this->__writeAccess = false;
			return false;*/
		}
	}
	
	public function hasReadAccess()
	{
		return true; /* HACK: Speed up 
	
		if ($this->__readAccess != null)
			return $this->__readAccess;
		
		try
		{
			$query = new Query(new Client(), "START u=node:exactUser(id={userId}),n=node:exactNode(id={nodeId}) " .
											 "MATCH (u)-[r?:USER_CREATED_TAG|USER_RECEIVED_TAG]->(t)-[:TAG_TAGGED_NODE]->(n) " .
											 "RETURN r,t.visibility",
											array( 'userId' => $this->__user->id,		
												   'nodeId' => $this->id 
												 )
								);

			$row = $query->getResultSet()->current();
			$this->__readAccess = ($row["t.visibility"] == Visibility::All)
							   || ($row["t.visibility"] == Visibility::Some && $row["r"] != null) 
							   || ($row["t.visibility"] == Visibility::None && $row["r"] != null && $row["r"]->getType() == "USER_CREATED_TAG");
			
			return $this->__readAccess;
		}
		catch (Exception $e)
		{
			$this->__readAccess = false;
			return false;
		}*/
	}
}

?>