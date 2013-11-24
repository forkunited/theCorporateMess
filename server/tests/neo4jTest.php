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

require_once('../classes/User.php');
require_once('../classes/MessTag.php');
require_once('../classes/MessNode.php');
require_once('../classes/MessRelationship.php');
require_once('../classes/Visibility.php');
require_once('../classes/MessGraph.php');

$u1 = User::create("u1");
$u2 = User::create("u2");

$t1 = MessTag::create($u1, "t1");
$t2 = MessTag::create($u2, "t2");
$t3 = MessTag::create($u1, "t3");

$n1 = MessNode::create($u1, $t1, "brief1", "thorough1", 1, 2);
$n2 = MessNode::create($u2, $t2, "brief2", "thorough2", 3, 4);
$n3 = MessNode::create($u1, $t1, "brief3", "thorough3", 5, 6);

$r1 = MessRelationship::create($u1, $n1, $n2, MessRelationshipType::Implied, 0, MessRelationshipDirection::Forward);
$r2 = MessRelationship::create($u2, $n2, $n3, MessRelationshipType::Implied, 1, MessRelationshipDirection::Backward);
$r2 = MessRelationship::create($u2, $n3, $n1, MessRelationshipType::Implied, 2, MessRelationshipDirection::None);

$n1->brief = "asdfsdfasdf";
$n1->update();

$r1->group = 10000000000;
$r1->update();

$t1->name = "asdfasdf";
$t1->update();

//$t2->delete();
//$n2->delete();
//$r2->delete();

/* Test graph retrieval */
$g = new MessGraph();
$t1->retrieveGraph($g);
$t2->retrieveGraph($g);
$t3->retrieveGraph($g);

echo $g->toJSON();

/* Test compaction */

echo 'Done.';

?>