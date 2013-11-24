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

require_once("MessNode.php");
require_once("MessRelationship.php");

class MessGraph
{
	private $metaData;
	private $tags;
	private $relationships;
	private $nodes;
	
	public function __construct()
	{
		$this->metaData = null;
		$this->tags = array();
		$this->nodes = array();
		$this->relationships = array();
	}
	
	public function setMetaData($metaData) {
		$this->metaData = $metaData;
	}
	
	public function addTag(MessTag $t)
	{
		$this->tags[$t->id] = $t;
	}
	
	public function hasTag($id) {
		return array_key_exists($id, $this->tags);
	}
	
	public function getTag($id) {
		return $this->tags[$id];
	}
	
	public function addNode(MessNode $n)
	{
		$this->nodes[$n->id] = $n;
		if (!isset($this->relationships[$n->id]))
			$this->relationships[$n->id] = array();
	}
	
	public function addRelationship(MessRelationship $r)
	{
		$this->addNode($r->from);
		$this->addNode($r->to);
		
		if (isset($this->relationships[$r->from->id][$r->to->id]))
		{
			$curRel = $this->relationships[$r->from->id][$r->to->id];
			if ($r->_updatedDate > $curRel->_updatedDate)
			{
				$this->relationships[$r->from->id][$r->to->id] = $r;
				$this->relationships[$r->to->id][$r->from->id] = $r; /* FIXME: Should only store one direction... but, this is easy for now */
			}
			elseif ($r->__writeAccess)
				$curRel->__writeAccess = true;
		}
		else
		{
			$this->relationships[$r->from->id][$r->to->id] = $r;
			$this->relationships[$r->to->id][$r->from->id] = $r;
		}
	}
	
	public function toJSON($tagIds = null)
	{
		$output = array();
		
		if ($this->metaData != null) 
		{
			array_push($output, array("objType" => "metaData", "metaData" => $this->metaData));
		}
		
		foreach ($this->tags as $t)
		{
			if ($tagIds != null && !in_array($t->id, $tagIds))
				continue;
		
			array_push($output, array("objType" => "tag", 
									  "tag" => array(
													  "id" => $t->id,
													  "name" => $t->name,
													  "visibility" => $t->visibility,
													  "creatorUserId" => $t->creator->id,
													  "compactionDate" => $t->_compactionDate,
													  "updatedDate" => $t->_updatedDate,
													  "nodeCount" => $t->_nodeCount,
													  "nodeIdIterator" => $t->_nodeIdIterator,
													  "readAccess" => $t->hasReadAccess(),
													  "writeAccess" => $t->hasWriteAccess()
													)
									 )
					);
		}
		
		/* Add in unspecified tags second */
		if ($tagIds != null) {
			foreach ($this->tags as $t)
			{
				if ($tagIds != null && in_array($t->id, $tagIds))
					continue;
			
				array_push($output, array("objType" => "tag", 
										  "tag" => array(
														  "id" => $t->id,
														  "name" => $t->name,
														  "visibility" => $t->visibility,
														  "creatorUserId" => $t->creator->id,
														  "compactionDate" => $t->_compactionDate,
														  "updatedDate" => $t->_updatedDate,
														  "nodeCount" => $t->_nodeCount,
														  "nodeIdIterator" => $t->_nodeIdIterator,
														  "readAccess" => $t->hasReadAccess(),
														  "writeAccess" => $t->hasWriteAccess()
														)
										 )
						);
			}
		}
		
		foreach ($this->nodes as $n)
		{	
			//if ($tagIds != null && !in_array($n->tag->id, $tagIds))
			//	continue;
		
			array_push($output, array("objType" => "node", 
									  "node" => array(
													  "id" => $n->id,
													  "tagId" => $n->tag->id,
													  "brief" => $n->brief, 
													  "thorough" => $n->thorough,
													  "posX" => $n->posX,
													  "posY" => $n->posY,
													  "main" => $n->main,
													  "readAccess" => $n->hasReadAccess(), 
													  "writeAccess" => $n->hasWriteAccess(),
													  "updatedDate" => $n->_updatedDate,
													  "deleted" => $n->_deleted
													)
									)
						);
		}
		
		$done = array();
		foreach ($this->relationships as $n1 => $nrs)
		{
			$done[$n1] = true;
			foreach ($nrs as $n2 => $r)
			{
				//if ($tagIds != null && (!in_array($r->from->id, $tagIds) || !in_array($r->to->id, $tagIds)))
				//	continue;
				
				if (array_key_exists($n2, $done))
					continue;
			
				array_push($output, array("objType" => "relationship", 
										  "relationship" => array(
														  "id" => $r->id,
														  "id1" => $r->from->id, 
														  "id2" => $r->to->id, 
														  "type" => $r->type, 
														  "group" => $r->group, 
														  "direction" => $r->direction,
														  "thorough" => $r->thorough,
														  "readAccess" => $r->hasReadAccess(), 
														  "writeAccess" => $r->hasWriteAccess(),
														  "updatedDate" => $r->_updatedDate,
														  "deleted" => $r->_deleted
														)
										)
							);
			}
		}
		
		return $output;
	}
}

?>