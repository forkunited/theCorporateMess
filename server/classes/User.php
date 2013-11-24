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

use Everyman\Neo4j\Client,
	Everyman\Neo4j\Index\NodeIndex,
	Everyman\Neo4j\Node,
	Everyman\Neo4j\Batch,
	Everyman\Neo4j\Cypher\Query;

class User 
{
	private $__client;

	private $id;

	public function __construct($id)
	{
		$this->id = $id;
		$this->__client = new Client();
	}
	
	public function __get($var)
	{
		return $this->{$var};
	}
	
	/* Deprecated (used by user tag menu) */
	public function retrieveTags($user)
	{
		try
		{
			$query = new Query($this->__client, "START u=node:exactUser(id={userId}),c=node:exactUser(id={currentUserId}) " .
												"MATCH (u)-[:USER_CREATED_TAG]->(t)<-[ct?:USER_CREATED_TAG|USER_RECEIVED_TAG]-(c) " .
												"RETURN t,ct",
							array( 'userId' => $this->id,
								   'currentUserId' => $user->id
								 )
			);
			
			$result = $query->getResultSet();
			$tags = array();
			
			foreach ($result as $row)
			{
				$tag = new MessTag($user, $row['t']->getProperty('id'), $this, $row['t']->getProperty('name'), $row['t']->getProperty('visibility'), 
									$row['t']->getProperty('visibility') == Visibility::All
										|| ($row['t']->getProperty('visibility') == Visibility::Some && $row['ct'] != null)
										|| ($row['t']->getProperty('visibility') == Visibility::None && $row['ct'] != null && $row['ct']->getType() == 'USER_CREATED_TAG'), 
									$row['ct'] != null && $row['ct']->getType() == 'USER_CREATED_TAG');
				
				$tag->_compactionDate = $row['t']->getProperty('_compactionDate');
				$tag->_updatedDate = $row['t']->getProperty('_updatedDate');
				$tag->_nodeCount = $row['t']->getProperty('_nodeCount');
				
				if ($tag->hasReadAccess())
					array_push($tags, $tag);
			}
			
			return $tags;
		}
		catch (Exception $e)
		{
			return null;
		}
	}
	
	public static function create($id)
	{
		try
		{
			$client = new Client();
			$client->startBatch();
		
			/* Check to see if user already exists */
			$userIndex = new NodeIndex($client, 'exactUser');
			$existingUser = $userIndex->findOne('id', $id);
			if (!is_null($existingUser))
				return new User($id);
			
			/* If user does not already exist, then create it and add to indices */
			$_nodeTypeIndex = new NodeIndex($client, '_nodeTypeIndex');
			$userNode = $client->makeNode();
			$userNode->setProperty('_type', 'User');
			$userNode->setProperty('id', $id);
		
			$client->saveNode($userNode);
			$client->addToIndex($userIndex, $userNode, 'id', $id);
			$client->addToIndex($_nodeTypeIndex, $userNode, '_type', 'User');
			
			if (!$client->commitBatch())
				return null;
		}
		catch (Exception $e)
		{
			return null;
		}
		
		/* Return user */
		return new User($id);
	}	
	
	/* Deprecated (used by user tag menu) */
	public static function retrieveAll()
	{
		try 
		{
			$client = new Client();
			$_nodeTypeIndex = new NodeIndex($client, '_nodeTypeIndex');
			$userNodes = $_nodeTypeIndex->find('_type', 'User');
			$users = array();
			foreach ($userNodes as $userNode)
			{
				array_push($users, $userNode->getProperty('id'));
			}
			
			return $users;
		}
		catch (Exception $e)
		{
			return null;
		}
	}
}

?>