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
require_once("User.php");

use Everyman\Neo4j\Client,
	Everyman\Neo4j\Index\NodeIndex,
	Everyman\Neo4j\Node,
	Everyman\Neo4j\Batch,
	Everyman\Neo4j\Cypher\Query;

class RetrieveUsers
{
	const AccessToTag = "accessToTag";
	const All = "all";
	
	private $__client;
	private $__user;

	public function __construct($user)
	{
		$this->__client = new Client();
		$this->__user = $user;
	}
	
	public function run($queryType, $params)
	{
		switch ($queryType)
		{
			case RetrieveUsers::AccessToTag: return $this->accessToTag($params->{'tagId'});
			case RetrieveUsers::All: return $this->all();
			default: return null;
		}
	}
	
	public function __get($var)
	{
		return $this->{$var};
	}
	
	public function accessToTag($tagId)
	{
		$tag = new MessTag($this->__user, $tagId);
		return $tag->retrieveUsersWithAccess();
	}
	
	public function all() {
		return User::retrieveAll();
	}
}

?>