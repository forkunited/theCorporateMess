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
require_once('auth.php'); 
require_once('./classes/User.php');
require_once('./classes/RetrieveUsers.php');
require_once('./classes/StorageMessage.php');

$u = new User($GLOBALS['User']);

if (!isset($_POST["message"]))
	die("No message info.");
	
$requestMessage = json_decode($_POST["message"]);
if (is_null($requestMessage)) 
	die('Could not decode JSON message string. (' . json_last_error() . ')');

if ($requestMessage->{'messageType'} != StorageMessage::RequestRetrieveUsers
	|| !isset($requestMessage->{'queryType'}) 
	|| !isset($requestMessage->{'params'})) 
	die("Invalid user retrieval message");
	
$queryType = $requestMessage->{'queryType'};
$params = $requestMessage->{'params'};

$retrieve = new RetrieveUsers($u);

$retUsers = $retrieve->run($queryType, $params);
if (is_null($retUsers))
	die('Retrieval query failed.');

$retUserIds = array();
for ($i = 0; $i < count($retUsers); $i++) {
	$retUserIds[$i] = $retUsers[$i]->id;
}
	
$retStr = json_encode(array(0 => StorageMessage::makeRespondRetrieveUsers($retUserIds, $queryType, $params)));
if (!$retStr)
	die('Could not encode JSON return string. (' . json_last_error() . ')');

echo $retStr;

?>