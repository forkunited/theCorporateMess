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

//exit(0);

require_once("phar:///cre/server/lib/neo4jphp.phar");

require_once('/cre/server/classes/User.php');
require_once('/cre/server/classes/MessTag.php');

use Everyman\Neo4j\Client,
	Everyman\Neo4j\Index\NodeIndex,
	Everyman\Neo4j\Index\NodeFulltextIndex,
	Everyman\Neo4j\Index\RelationshipIndex,
	Everyman\Neo4j\Node,
	Everyman\Neo4j\Relationship,
	Everyman\Neo4j\Cypher\Query;

echo 'Starting setup... Done.<br/>';

$client = new Client();

/* Delete all nodes and relationships */
echo 'Deleting nodes and relationships... ';

$query = new Query($client, "START n=node(*) " .
							"MATCH (n)-[r]->() " .
							"DELETE n, r");
$query->getResultSet();

$query = new Query($client, "START n=node(*) DELETE n");
$query->getResultSet();

echo 'Done.<br/>';

$userIndex = new NodeIndex($client, 'exactUser');
$tagIndex = new NodeIndex($client, 'exactTag'); 
$nodeIndex = new NodeIndex($client, 'exactNode'); 
$_nodeTypeIndex = new NodeIndex($client, '_nodeTypeIndex');

$nodeFulltextIndex = new NodeFulltextIndex($client, 'fulltextNode');
$tagFulltextIndex = new NodeFulltextIndex($client, 'fulltextTag');
$relationshipIndex = new RelationshipIndex($client, 'exactRelationship');

/* Delete all indexes */
echo 'Deleting indexes... ';

$userIndex->delete();
$tagIndex->delete();
$nodeIndex->delete();
$_nodeTypeIndex->delete();
$nodeFulltextIndex->delete();
$tagFulltextIndex->delete();
$relationshipIndex->delete();

echo 'Done.<br/>';

/* Create indexes */
echo 'Creating indexes... ';

$userIndex->save();
$tagIndex->save();
$nodeIndex->save();
$_nodeTypeIndex->save();
$tagFulltextIndex->save();
$nodeFulltextIndex->save();
$relationshipIndex->save();

echo 'Done.<br/>';

echo 'Finishing setup... Done.<br/>';

?>