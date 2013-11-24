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
require_once("Visibility.php");
require_once("MessObject.php");

use Everyman\Neo4j\Client,
	Everyman\Neo4j\Index\NodeIndex,
	Everyman\Neo4j\Index\NodeFulltextIndex,
	Everyman\Neo4j\Node,
	Everyman\Neo4j\Relationship,
	Everyman\Neo4j\Cypher\Query;

class MessTag extends MessObject
{
	//const DELETIONS_FOR_COMPACTION = 10; 

	private $__user;
	private $__readAccess;
	private $__writeAccess;
	private $__retrieved;

	private $_compactionDate;
	private $_deletionsSinceCompaction;
	private $_updatedDate;
	private $_nodeCount;
	private $_nodeIdIterator;
	
	private $id;
	private $name;
	private $visibility;
	
	private $creator;

	public function __construct(User $user, $id, User $creator=null, $name=null, $visibility=null, $readAccess = null, $writeAccess = null)
	{
		$this->id = $id;
		$this->creator = $creator;
		$this->name = $name;
		$this->visibility = $visibility;
		
		$this->__client = null; 
		$this->__user = $user;

		$this->__readAccess = $readAccess;
		$this->__writeAccess = $writeAccess;
		
		$this->__retrieved = false;
	}
	
	public function __get($var)
	{
		return $this->{$var};
	}
	
	public function __set($var, $value)
	{
		$this->{$var} = $value;
	}
	
	public static function create(User $user, $name, $visibility=Visibility::All, MessTransaction $transaction = null)
	{
		$client = null;
		try
		{
			$clientProvided = true;
			if ($transaction == null)
			{
				$client = new Client();
				$client->startBatch();
				$clientProvided = false;
			} else {
				$client = $transaction->getClient();
			}
			
			/* Check to see if the tag already exists under this user before creating it */
			$query = new Query($client, "START u=node:exactUser(id={userId}) " .
										"MATCH (u)-[:USER_CREATED_TAG]->(t) " .
										"WHERE t.name={tagName} " .
										"RETURN t",
										array( 'userId' => $user->id,		
											   'tagName' => $name 
											)
								);
			if ($query->getResultSet()->count() > 0)
				return null;
			
			/* Create tag node, relate it to creator, and add it to indices */
			$id = uniqid();

			$userIndex = new NodeIndex($client, 'exactUser');
			$tagIndex = new NodeIndex($client, 'exactTag');
			$fulltextTagIndex = new NodeFulltextIndex($client, 'fulltextTag');			
			
			$userNode = $userIndex->findOne('id', $user->id);
				
			$tagNode = $client->makeNode();
			$tagNode->setProperty('type', 'MessTag');
			$tagNode->setProperty('id', $id);
			$tagNode->setProperty('name', $name);
			$tagNode->setProperty('visibility', $visibility);
			$tagNode->setProperty('_deletionsSinceCompaction', 0);
			$tagNode->setProperty('_compactionDate', time());
			$tagNode->setProperty('_updatedDate', time());
			$tagNode->setProperty('_nodeCount', 0);
			$tagNode->setProperty('_nodeIdIterator', 0);
			$tagNode->setProperty('_recentlyUpdated', ($visibility == Visibility::All));
			$tagNode->setProperty('_creator', $user->id);
			
			$userTagRelationship = $userNode->relateTo($tagNode, 'USER_CREATED_TAG');
		
			$client->saveNode($tagNode);
			$client->saveNode($userNode);
			$client->saveRelationship($userTagRelationship);
			$client->addToIndex($tagIndex, $tagNode, 'name', $name);
			$client->addToIndex($tagIndex, $tagNode, 'id', $id);
			$client->addToIndex($tagIndex, $tagNode, '_recentlyUpdated', ($visibility == Visibility::All));
			$client->addToIndex($fulltextTagIndex, $tagNode, 'name', $name);
			$client->addToIndex($fulltextTagIndex, $tagNode, '_creator', $user->id);
			
			if (!$clientProvided)
				if (!$client->commitBatch())
					return null;
		}
		catch (Exception $e)
		{
			return null;
		}
		
		/* Return tag */
		return new MessTag($user, $id, $user, $name, $visibility, true, true);
	}
	
	public function retrieve()
	{	
		if (!$this->hasReadAccess())
			return false;
		
		try
		{
			$tagIndex = new NodeIndex(new Client(), 'exactTag');
			$tagNode = $tagIndex->findOne('id', $this->id);
			if (is_null($tagNode))
				return false;
			
			if ($this->name == null) $this->name = $tagNode->getProperty('name');
			if ($this->visibility == null) $this->visibility = $tagNode->getProperty('visibility');
			if ($this->_deletionsSinceCompaction == null) $this->_deletionsSinceCompaction = $tagNode->getProperty('_deletionsSinceCompaction');
			if ($this->_compactionDate == null) $this->_compactionDate = $tagNode->getProperty('_compactionDate');
			if ($this->_updatedDate == null) $this->_updatedDate = $tagNode->getProperty('_updatedDate');
			if ($this->_nodeCount == null) $this->_nodeCount = $tagNode->getProperty('_nodeCount');
			if ($this->_nodeIdIterator == null) $this->_nodeIdIterator = $tagNode->getProperty('_nodeIdIterator');
			
			/* FIXME: It's faster to do this through cypher */
			$userRelation = $tagNode->getFirstRelationship(array('USER_CREATED_TAG'));
			$this->creator = new User($userRelation->getStartNode()->getProperty('id'));
		}
		catch (Exception $e)
		{
			return false;
		}
		$this->__retrieved = true;
		return true;
	}
	
	public function delete()
	{	
		if (!$this->hasWriteAccess())
			return false;
			
		try
		{	
			$this->compact();
		
			$accessUsers = $this->retrieveUsersWithAccess();
			for ($i = 0; $i < count($accessUsers); $i++)
				$this->removeAccess($accessUsers[$i]);
		
			$client = $this->clientBegin();
			
			$tagIndex = new NodeIndex($client, 'exactTag');
			$tagFulltextIndex = new NodeFulltextIndex($client, 'fulltextTag');	
			
			$tagNode = $tagIndex->findOne('id', $this->id);
			$userRelation = $tagNode->getFirstRelationship(array('USER_CREATED_TAG'));
			
			$client->removeFromIndex($tagIndex, $tagNode);
			$client->removeFromIndex($tagFulltextIndex, $tagNode);
			$client->deleteRelationship($userRelation);
			$client->deleteNode($tagNode);
			
			return $this->clientEnd($client);
		}
		catch (Exception $e)
		{
			return false;
		}
	}
	
	public function update()
	{
		if (!$this->hasWriteAccess())
			return false;
		
		if (!$this->__retrieved)
			if (!$this->retrieve())
				return false;
			
		try
		{
			$client = $this->clientBegin();
		
			$fulltextTagIndex = new NodeFulltextIndex($client, 'fulltextTag');	
			$tagIndex = new NodeIndex($client, 'exactTag');
			
			$tagNode = $tagIndex->findOne('id', $this->id);
			$tagNode->setProperty('name', $this->name);
			$tagNode->setProperty('visibility', $this->visibility);
			$tagNode->setProperty('_updatedDate', $this->_updatedDate);
			$tagNode->setProperty('_compactionDate', $this->_compactionDate);
			$tagNode->setProperty('_deletionsSinceCompaction', $this->_deletionsSinceCompaction);
			$tagNode->setProperty('_nodeCount', $this->_nodeCount);
			$tagNode->setProperty('_nodeIdIterator', $this->_nodeIdIterator);
			$tagNode->setProperty('_recentlyUpdated', $this->visibility == Visibility::All);
			$tagNode->setProperty('_creator', $this->creator->id);
			
			$client->removeFromIndex($fulltextTagIndex, $tagNode);
			$client->addToIndex($fulltextTagIndex, $tagNode, 'name', $this->name);
			$client->addToIndex($fulltextTagIndex, $tagNode, '_creator', $this->creator->id);
			
			$client->removeFromIndex($tagIndex, $tagNode, 'name');
			$client->addToIndex($tagIndex, $tagNode, 'name', $this->name);
			$client->addToIndex($tagIndex, $tagNode, '_recentlyUpdated', $this->visibility == Visibility::All);
			
			$client->saveNode($tagNode);
			
			return $this->clientEnd($client);
		}
		catch (Exception $e)
		{
			return false;
		}
	}
	
	public function grantAccess($user) 
	{
		if (!$this->hasWriteAccess())
			return false;
		if ($user->id == $this->__user->id)
			return false;
		
		try
		{	
			$client = $this->clientBegin();
	
			$query = new Query($client, "START u=node:exactUser(id={userId}),t=node:exactTag(id={tagId}) " .
										"CREATE UNIQUE (u)-[ut:USER_RECEIVED_TAG]->(t) " .
										"RETURN ut",
												array( 'userId' => $user->id,		
													   'tagId' => $this->id 
													 )
								);
								
			if ($query->getResultSet()->count() > 1)
				return false;
			
			return $this->clientEnd($client);
		}
		catch (Exception $e)
		{
			return false;
		}
	}
	
	public function removeAccess($user) 
	{
		if (!$this->hasWriteAccess())
			return false;
		if ($user->id == $this->__user->id)
			return false;
		
		try
		{	
			$client = $this->clientBegin();
	
			$query = new Query($client, "START u=node:exactUser(id={userId}),t=node:exactTag(id={tagId}) " .
										"MATCH (u)-[ut:USER_RECEIVED_TAG]->(t) " .
										"DELETE ut " .
										"RETURN u,t",
										array( 'userId' => $user->id,		
											   'tagId' => $this->id 
											 )
								);
								
			if ($query->getResultSet()->count() > 1)
				return false;
			
			return $this->clientEnd($client);
		}
		catch (Exception $e)
		{
			return false;
		}
	}
	
	public function retrieveUsersWithAccess()
	{
		if (!$this->hasWriteAccess())
			return null;

		try
		{
			$client = new Client();
			
			$query = new Query($client, "START t=node:exactTag(id={tagId}) " .
										"MATCH (u)-[ut:USER_RECEIVED_TAG]->(t) " .
										"RETURN u",
										array('tagId' => $this->id)
								);
			
			$users = array();
			$result = $query->getResultSet();
			foreach ($result as $row)
			{
				array_push($users, new User($row["u"]->getProperty("id")));
			}
			
			return $users;
		}
		catch (Exception $e)
		{
			return null;
		}
	}
	
	public function getNextNodeId() {
		if (!$this->hasReadAccess() || (!$this->__retrieved && !$this->retrieve()))
			return null;
			
		return $this->id . '_' . $this->_nodeIdIterator;
	}
	
	public function retrieveGraph(MessGraph $graph, $minUpdatedDate = 0, $compactionDate = 0)
	{	
		if (!$this->hasReadAccess() || !$this->retrieve())
			return false;
	
		/* If there has been a recent compaction, then retrieve all nodes, otherwise retrieve only updated nodes */
		try
		{
			$client = new Client();
			$query = null;
			if ($this->_compactionDate >= $compactionDate)
			{
				$query = new Query($client, "START t=node:exactTag(id={tagId}) " .
													"MATCH (t)-[:TAG_TAGGED_NODE]->(n)-[r?:MESS_RELATIONSHIP]-(nr)<-[:TAG_TAGGED_NODE]-(tr) " .
													"RETURN n, r, nr, tr.id",
								array( 'tagId' => $this->id )
				);
			}
			else
			{
				$query = new Query($client, "START t=node:exactTag(id={tagId}) " .
													"MATCH (t)-[:TAG_TAGGED_NODE]->(n)-[r?:MESS_RELATIONSHIP]-(nr)<-[:TAG_TAGGED_NODE]-(tr) " .
													"WHERE n._updatedDate >= {minUpdatedDate} OR r._updatedDate >= {minUpdatedDate} OR nr._updatedDate >= {minUpdatedDate} " .
													"RETURN n, r, nr, tr.id",
								array( 'tagId' => $this->id,
									   'minUpdatedDate' => $minUpdatedDate
								)
				);
			}

			$result = $query->getResultSet();
			foreach ($result as $row)
			{
				$n = new MessNode($this->__user, 
								  $row["n"]->getProperty("id"), 
								  $this, 
								  $row["n"]->getProperty("brief"), 
								  $row["n"]->getProperty("thorough"), 
								  $row["n"]->getProperty("posX"),
								  $row["n"]->getProperty("posY"),
								  $row["n"]->getProperty("main"),
								  $this->hasReadAccess(),
								  $this->hasWriteAccess());
				$n->_updatedDate = $row["n"]->getProperty("_updatedDate");
				$n->_deleted = $row["n"]->getProperty("_deleted");
				$graph->addNode($n); 

				if (!is_null($row['r']))
				{	
					if ($this->id == $row["tr.id"]) 
					{
						$tr = $this;
					} 
					elseif ($graph->hasTag($row["tr.id"])) 
					{
						$tr = $graph->getTag($row["tr.id"]);
					} 
					else 
					{
						$tr = new MessTag($this->__user, $row["tr.id"]);
						if (!$tr->retrieve())
							continue;
						$graph->addTag($tr);
					}
				
					$nr = new MessNode($this->__user, 
									  $row["nr"]->getProperty("id"), 
									  $tr, 
									  $row["nr"]->getProperty("brief"), 
									  $row["nr"]->getProperty("thorough"), 
									  $row["nr"]->getProperty("posX"),
									  $row["nr"]->getProperty("posY"),
									  $row["nr"]->getProperty("main"),
									  $tr->hasReadAccess(),
									  $tr->hasWriteAccess());
					$nr->_updatedDate = $row["nr"]->getProperty("_updatedDate");
					$nr->_deleted = $row["nr"]->getProperty("_deleted");
					$graph->addNode($nr);
					
					$from = null;
					$to = null;
					if ($row["r"]->getStartNode()->getProperty("id") == $nr->id)
					{
						$from = $nr;
						$to = $n;
					}
					else
					{
						$from = $n;
						$to = $nr;
					}
					
					$r = new MessRelationship($this->__user, 
											 $row["r"]->getProperty("id"), 
											 $from, 
											 $to, 
											 $row["r"]->getProperty("type"), 
											 $row["r"]->getProperty("group"), 
											 $row["r"]->getProperty("direction"),
											 $row["r"]->getProperty("thorough"),
											 $this->hasReadAccess(),
											 $this->hasWriteAccess());
					$r->_updatedDate = $row["r"]->getProperty("_updatedDate");
					$r->_deleted = $row["r"]->getProperty("_deleted");				
					
					$graph->addRelationship($r);
				}
			}
			
			$graph->addTag($this);
		}
		catch (Exception $e)
		{
			return false;
		}
	
		return true;// return $this->_deletionsSinceCompaction < MessTag::DELETIONS_FOR_COMPACTION || $this->compact();
	}
	
	public function hasWriteAccess()
	{
		if ($this->__writeAccess != null)
			return $this->__writeAccess;
	
		/* Check to see if the user created the tag */
		try
		{
			$query = new Query(new Client(), "START u=node:exactUser(id={userId}),t=node:exactTag(id={tagId}) " .
											   "MATCH (u)-[:USER_CREATED_TAG]->(t) " .
											   "RETURN t",
												array( 'userId' => $this->__user->id,		
													   'tagId' => $this->id 
													 )
								);
								
			$this->__writeAccess = $query->getResultSet()->count() > 0;
			return $this->__writeAccess;
		}
		catch (Exception $e)
		{
			$this->__writeAccess = false;
			return false;
		}
	}
	
	public function hasReadAccess()
	{
		if ($this->__readAccess != null)
			return $this->__readAccess;
		
		try
		{
			$query = new Query(new Client(), "START u=node:exactUser(id={userId}),t=node:exactTag(id={tagId}) " .
											 "MATCH (u)-[r?:USER_CREATED_TAG|USER_RECEIVED_TAG]->(t) " .
											 "RETURN r,t.visibility",
											array( 'userId' => $this->__user->id,		
												   'tagId' => $this->id 
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
		}
	}
	
	public function compact()
	{
		/* FIXME: Really, these deletes should be done atomically, but this will work for now.
		 * If retrievals occur between these deletions, it's possible that the deletions will
		 * not appear to users until after the next retrieval after compaction (when the graph
		 * is fully updated again after the compaction).  
		 */
		try
		{
			$client = new Client();
			
			/* Remove deleted relationships and relationships adjacent to deleted nodes
			/* Remove deleted nodes  */
			/* Remove deleted relationships */
			$query = new Query($client, "START t=node:exactTag(id={tagId}) " .
											   "MATCH (t)-[:TAG_TAGGED_NODE]->(nd)-[rd:MESS_RELATIONSHIP]-() " .
											   "WHERE nd._deleted = true OR rd._deleted = true " .
											   "DELETE rd",
												array( 'tagId' => $this->id )
								);
			$query->getResultSet();
			
			$query = new Query($client, "START t=node:exactTag(id={tagId}) " .
											   "MATCH (t)-[rd:TAG_TAGGED_NODE]->(nd) " .
											   "WHERE nd._deleted = true " .
											   "DELETE rd, nd",
												array( 'tagId' => $this->id )
								);
			$query->getResultSet();
			
			/* Update compaction date */
			$this->_compactionDate = time();
			$this->_deletionsSinceCompaction = 0;
			
			$client->startBatch();
			$tagIndex = new NodeIndex($client, 'exactTag');
			$tagNode = $tagIndex->findOne('id', $this->id);
			$tagNode->setProperty('_compactionDate', $this->_compactionDate);
			$tagNode->setProperty('_deletionsSinceCompaction', $this->_deletionsSinceCompaction);
			$this->__client->saveNode($tagNode);
			return $client->commitBatch();
		
		}
		catch (Exception $e)
		{
			return false;
		}
	}
}

?>