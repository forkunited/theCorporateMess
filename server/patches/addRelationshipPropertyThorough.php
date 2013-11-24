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

exit(0);
require_once('../auth.php');
require_once("phar://../lib/neo4jphp.phar");

use Everyman\Neo4j\Client,
	Everyman\Neo4j\Index\NodeIndex,
	Everyman\Neo4j\Node,
	Everyman\Neo4j\Relationship,
	Everyman\Neo4j\Cypher\Query;

$query = new Query(new Client(), "START u=node:_nodeTypeIndex(_type='User')
								  MATCH u-[:USER_CREATED_TAG]->t-[:TAG_TAGGED_NODE]->n1-[r:MESS_RELATIONSHIP]->n2
								  SET r.thorough = ''"
					);
					
$query->getResultSet();

echo 'Done.';

?>