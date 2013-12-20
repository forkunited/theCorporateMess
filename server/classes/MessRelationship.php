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
require_once("MessObject.php");
require_once("MessNode.php");
require_once("MessRelationshipType.php");
require_once("MessRelationshipDirection.php");

use Everyman\Neo4j\Client,
	Everyman\Neo4j\Index\NodeIndex,
	Everyman\Neo4j\Index\RelationshipIndex,
	Everyman\Neo4j\Node,
	Everyman\Neo4j\Relationship,
	Everyman\Neo4j\Cypher\Query;

class MessRelationship extends MessObject
{
	private $__user;
	private $__readAccess;
	private $__writeAccess;

	private $id;
	private $from;
	private $to;
	private $type;
	private $group;
	private $direction;
	
	private $thorough;
	
	private $_updatedDate;
	private $_deleted;
	
	public function __construct(User $user, $id, MessNode $from=null, MessNode $to=null, $type=MessRelationshipType::Implied, $group = 0, $direction = MessRelationshipDirection::None, $thorough = "", $readAccess = null, $writeAccess = null)
	{
		$this->id = $id;
		$this->from = $from;
		$this->to = $to;
		$this->type = $type;
		$this->group = $group;
		$this->direction = $direction;
		$this->thorough = $thorough;
		
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
	
	public static function create(User $user, MessNode $from, MessNode $to, $type=MessRelationshipType::Implied, $group = 0, $direction = MessRelationshipDirection::None, $thorough = "", MessTransaction $transaction = null)
	{
		$retRel = null;
		$client = null;
		try
		{
			/* HACK: Don't check permissions to save time
			
			if (!(($from->hasReadAccess() && $to->hasWriteAccess()) || ($from->hasWriteAccess() && $to->hasReadAccess()) || ($from->hasWriteAccess() && $to->hasWriteAccess()))) {
				return null;
			}
			*/
			
			/* Create mess relationship and add it to indices */
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
			
			$id = null;
			if (strcmp($from->id, $to->id) < 0)
				$id = $from->id . '_' . $to->id;
			else
				$id = $to->id . '_' . $from->id;
			
			$nodeIndex = new NodeIndex($client, 'exactNode');
			$relationshipIndex = new RelationshipIndex($client, 'exactRelationship');
			
			// Check if it already exists
			/* HACK: Don't check for now to save time 
			if ($relationshipIndex->findOne('id', $id) != null || ($transaction != null && $transaction->hasObject($id))) {
				echo 'Already exists...'; // FIXME: Remove after debug
				return null;
			}
			*/
			
			if ($to->__cachedNeo4jNode == null) 
				$to->__cachedNeo4jNode = $nodeIndex->findOne('id', $to->id);
			$toNode = $to->__cachedNeo4jNode;
			
			if ($from->__cachedNeo4jNode == null)
				$from->__cachedNeo4jNode = $nodeIndex->findOne('id', $from->id);
			$fromNode = $from->__cachedNeo4jNode;
			
			$messRelationship = $client->makeRelationship();
			$messRelationship->setStartNode($fromNode)
							 ->setEndNode($toNode)
							 ->setType('MESS_RELATIONSHIP')
							 ->setProperty('id', $id)
							 ->setProperty('type',$type)
							 ->setProperty('group', $group)
							 ->setProperty('direction', $direction)
							 ->setProperty('thorough', $thorough)
							 ->setProperty('_deleted', false)
							 ->setProperty('_updatedDate', time());
			
			$client->saveRelationship($messRelationship);
			$client->addToIndex($relationshipIndex, $messRelationship, 'id', $id);
			
			$retRel = new MessRelationship($user, $id, $from, $to, $type, $group, $direction, $thorough, true, true);
			$retRel->setTransaction($transaction);
			if (!$retRel->saveTags($client, $messRelationship, false)) {
				echo 'Save tags failed'; // FIXME: Remove after debug
				return null;
			}
		
			if (!$clientProvided)
				if (!$client->commitBatch()) {
					echo 'Failed to commit'; // FIXME: Remove after debug
					return null;
				}
		}
		catch (Exception $e)
		{
			echo $e->getMessage() . "\n" . var_dump($e->getTrace()) . "\n";
			return null;
		}
		
		/* Return relationship */
		return $retRel;
	}
	
	public function retrieve()
	{
		/* HACK: Skip to save time 
		if (!$this->hasReadAccess())
			return false;
		*/
	
		try
		{
			$query = new Query(new Client(), "START r=node:exactRelationship(id={relationshipId}) " .
							"MATCH (from)-[r:USER_CREATED_TAG]->(to) " .
							"WHERE r._deleted=false " .
							"RETURN from.id, to.id, r.type, r.group, r.direction, r.thorough, r._updatedDate, r._deleted",
							array( 'relationshipId' => $this->id
								 )
					);
			
			$result = $query->getResultSet();
			if ($result->count() == 0)
				return false;
			
			$row = $result->current();
			
			$this->from = new MessNode($this->__user, $row['from.id']);
			$this->to = new MessNode($this->__user, $row['to.id']);
			$this->type = $row['r.type'];
			$this->group = $row['r.group'];
			$this->direction = $row['r.direction'];
			$this->thorough = $row['r.thorough'];
			$this->_deleted = $row['r._deleted'];
			$this->_updatedDate = $row['r._updatedDate'];
		}
		catch (Exception $e)
		{
			echo $e->getMessage() . "\n" . var_dump($e->getTrace()) . "\n";
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
		
			$relationshipIndex = new RelationshipIndex($client, 'exactRelationship');
			$messRelationship = $relationshipIndex->findOne('id', $this->id);
			$client->removeFromIndex($relationshipIndex, $messRelationship);
			$messRelationship->setProperty('_deleted', true);
			$messRelationship->setProperty('_updatedDate', time());
			
			if (!$this->saveTags($client, $messRelationship, true))
				return false;
				
			$client->saveRelationship($messRelationship);
			
			return $this->clientEnd($client);
		}
		catch (Exception $e)
		{
			return false;
		}
	}
	
	public function update()
	{
		/* This only can update the properties of the relationship... not the nodes that it relates */
		if (!$this->hasWriteAccess())
			return false;

		try
		{
			$client = $this->clientBegin();
			
			$exactRelationshipIndex = new RelationshipIndex($client, 'exactRelationship');
			$messRelationship = $exactRelationshipIndex->findOne('id', $this->id);
				
			$messRelationship->setProperty('direction', $this->direction);
			$messRelationship->setProperty('group', $this->group);
			$messRelationship->setProperty('type', $this->type);
			$messRelationship->setProperty('thorough', $this->thorough);
			$messRelationship->setProperty('_updatedDate', time());
			$messRelationship->setProperty('_deleted', false);
			
			if (!$this->saveTags($client, $messRelationship, false))
				return false;
			
			$client->saveRelationship($messRelationship);
			
			return $this->clientEnd($client);
		}
		catch (Exception $e)
		{
			return false;
		}
	}

	private function saveTags($client, $messRelationship, $addDeletion = false) {
		$fromTagId = null;
		if ($this->from != null && $this->from->tag != null)
			$fromTagId = $this->from->tag->id;
		else 
			$fromTagId = $messRelationship->getStartNode()->getFirstRelationship(array('TAG_TAGGED_NODE'))->getStartNode()->getProperty('id');
		
		$toTagId = null;
		if ($this->to != null && $this->to->tag != null)
			$toTagId = $this->to->tag->id;
		else
			$toTagId = $messRelationship->getEndNode()->getFirstRelationship(array('TAG_TAGGED_NODE'))->getStartNode()->getProperty('id');
		
		$fromTag = null;
		$toTag = null;
		if ($this->__transaction != null) {
			$fromTag = $this->__transaction->getTag($this->__user, $fromTagId);
			$toTag = $this->__transaction->getTag($this->__user, $toTagId);
		} else {
			$fromTag = new MessTag($this->__user, $fromTagId);
			$toTag = new MessTag($this->__user, $toTagId);
			$fromTag->setClient($client);
			$toTag->setClient($client);
		}
	
		$fromTagUpdate = true;
		$toTagUpdate = true;
		if ($fromTagId == $toTagId || $toTag == null || !$toTag->hasWriteAccess()) {
			// Update from tag only
			$toTagUpdate = false;
		} elseif ($fromTag == null || !$fromTag->hasWriteAccess()) {
			// Update to tag only
			$fromTagUpdate = false;	
		}
		
		if ($fromTagUpdate) {
			if (!$fromTag->__retrieved && !$fromTag->retrieve())
				return false;
			if ($addDeletion)
				$fromTag->_deletionsSinceCompaction++;
			$fromTag->_updatedDate = time();
		}
		
		if ($toTagUpdate) {
			if (!$toTag->__retrieved && !$toTag->retrieve())
				return false;
			if ($addDeletion)
				$toTag->_deletionsSinceCompaction++;
			$toTag->_updatedDate = time();
		}

		return (!$fromTagUpdate || $fromTag->update()) && (!$toTagUpdate || $toTag->update());
	}
	
	public function hasWriteAccess()
	{
		return true; /* HACK: Speed up
		if ($this->__writeAccess != null)
			return $this->__writeAccess;
	
		try
		{*/
			/* Check to see if the user created the tag for the node */
		/*	$query = new Query(new Client(), "START r=relationship:exactRelationship(id={relationshipId}), u=node:exactUser(id={userId}) " .
				"MATCH (u)-[:USER_CREATED_TAG]->(t)-[:TAG_TAGGED_NODE]->(n)-[r:MESS_RELATIONSHIP]-() " .
				"RETURN u",
				array( 'relationshipId' => $this->id,
					   'userId' => $this->__user->id
					 )
			);
			
			$this->__writeAccess = $query->getResultSet()->count() > 0;
			return $this->__writeAccess;
		}
		catch(Exception $e)
		{
			$this->__writeAccess = false;
			return false;
		}*/
	}
	
	public function hasReadAccess()
	{
		return true;
		/* HACK: Speed up
		if ($this->__readAccess != null)
			return $this->__readAccess;
	
		try
		{
			$query = new Query(new Client(), "START u=node:exactUser(id={userId}),r=relationship:exactRelationship(id={relationshipId}) " .
				"MATCH (u)-[ut?:USER_CREATED_TAG|USER_RECEIVED_TAG]->(t)-[:TAG_TAGGED_NODE]->(n)-[r:MESS_RELATIONSHIP]-() " .
				"RETURN ut,t.visibility",
				array( 
					  'userId' => $this->__user->id,
					  'relationshipId' => $this->id
					 )
			);
		
			$result = $query->getResultSet();
			if ($result->count() == 0)
			{
				$this->__readAccess = false;
				return false;
			}
			
			foreach ($result as $row)
			{
				if (($row["t.visibility"] != Visibility::All)
				 && !($row["t.visibility"] == Visibility::Some && $row["r"] != null) 
				 && !($row["t.visibility"] == Visibility::None && $row["r"] != null && $row["r"]->getType() == "USER_CREATED_TAG")
				    ) {
					$this->__readAccess = false;
					return false;
				}
			}
		}
		catch (Exception $e)
		{
			$this->__readAccess = false;
			return false;
		}
		
		$this->__readAccess = true;
		return true;*/
	}
	
}

?>