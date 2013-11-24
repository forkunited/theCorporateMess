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
require_once("MessTag.php");
require_once("MessNode.php");
require_once("MessRelationship.php");

use Everyman\Neo4j\Client,
	Everyman\Neo4j\Index\NodeIndex,
	Everyman\Neo4j\Index\NodeFulltextIndex,
	Everyman\Neo4j\Node,
	Everyman\Neo4j\Relationship,
	Everyman\Neo4j\Cypher\Query;

class MessTransaction
{
	private $__client;
	private $__objects;
	
	public function __construct()
	{
		$this->__client = new Client();
		$this->__objects = array();
	}  
	
	public function getClient() 
	{
		return $this->__client;
	}
	
	public function addObject(MessObject $obj)
	{
		if ($obj->hasWriteAccess()) 
		{
			$obj->setTransaction($this);
			$this->__objects[$obj->id] = $obj;
			return true;
		} else {
			return false;	
		}
	}
	
	public function hasObject($id) 
	{	
		return isset($this->__objects[$id]); 
	}
	
	public function getTag($user, $id) {
		if (array_key_exists($id, $this->__objects)) 
		{
			return $this->__objects[$id];
		} 
		else 
		{
			$tag = new MessTag($user, $id);
			if ($tag->retrieve() && $this->addObject($tag))
				return $tag;
			else
				return null;
		}
	}
	
	private function getNode($user, $id) {
		if (array_key_exists($id, $this->__objects)) 
		{	
			return $this->__objects[$id];
		} 
		else 
		{
			return new MessNode($user, $id);
		}
	}
	
	public function createTag(User $user, $name, $visibility=Visibility::All)
	{
		$tag = MessTag::create($user, $name, $visibility, $this);
		if ($tag == null)
			return null;
		$this->addObject($tag);
		return $tag;
	}
	
	public function createNode(User $user, $tempId, $tagId, $brief="", $thorough="", $posX = 0, $posY = 0, $main = false)
	{
		$node = MessNode::create($user, $this->getTag($user, $tagId), $brief, $thorough, $posX, $posY, $main, $this);
		if ($node == null)
			return null;
		$this->addObject($node);
		return $node;
	}
	
	public function createRelationship(User $user, $fromNodeId, $toNodeId, $type=MessRelationshipType::Implied, $group = 0, $direction = MessRelationshipDirection::None, $thorough = "")
	{
		$relationship = MessRelationship::create($user, $this->getNode($user, $fromNodeId), $this->getNode($user, $toNodeId), $type, $group, $direction, $thorough, $this);
		if ($relationship == null)
			return null;
		$this->addObject($relationship);
		return $relationship;
	}
	
	public function begin()
	{
		$this->__client->startBatch();
	}
	
	public function commit()
	{
		try
		{
			return $this->__client->commitBatch();
		}
		catch (Exception $e)
		{
			return false;
		}
	}
}

?>