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

require_once('./classes/User.php');
require_once('./classes/MessTag.php');
require_once('./classes/MessNode.php');
require_once('./classes/MessRelationship.php');
require_once('./classes/Visibility.php');
require_once('./classes/MessGraph.php');
require_once('./classes/MessTransaction.php');
require_once('./classes/StorageMessage.php');

//exit(0); // Don't allow modifications for now

if (!isset($_POST["messages"]))
	die("No message info.");
	
if (!isset($_POST["user"]))
	die("No user");

$u = new User($_POST['user']);
	
$requestMessages = json_decode($_POST["messages"]);

if (is_null($requestMessages)) 
	die('Could not decode JSON message string. (' . json_last_error() . ')');

$transaction = new MessTransaction();
$transaction->begin();

$responseMessages = array();

foreach ($requestMessages as $requestMessage)
{
	if ($requestMessage->{'messageType'} == StorageMessage::RequestAddNode)
	{
		if (is_null($node = $transaction->createNode($u,
							$requestMessage->{'node'}->{'id'},
							$requestMessage->{'node'}->{'tagId'}, 
							$requestMessage->{'node'}->{'brief'}, 
							$requestMessage->{'node'}->{'thorough'}, 
							$requestMessage->{'node'}->{'posX'}, 
							$requestMessage->{'node'}->{'posY'},
							$requestMessage->{'node'}->{'main'}))) 
		{
			array_push($responseMessages, StorageMessage::makeRespondAddNode(true, null, $requestMessage->{'node'}->{'id'}));
		}
		else 
		{		
			array_push($responseMessages, StorageMessage::makeRespondAddNode(false, $node->id, $requestMessage->{'node'}->{'id'}));
		}
	}
	else if ($requestMessage->{'messageType'} == StorageMessage::RequestAddRelationship)
	{
		if (is_null($relationship = $transaction->createRelationship($u, 
									$requestMessage->{'relationship'}->{'id1'}, 
									$requestMessage->{'relationship'}->{'id2'}, 
									$requestMessage->{'relationship'}->{'type'}, 
									$requestMessage->{'relationship'}->{'group'}, 
									$requestMessage->{'relationship'}->{'direction'},
									$requestMessage->{'relationship'}->{'thorough'})))
		{
			array_push($responseMessages, StorageMessage::makeRespondAddRelationship(true, null, $requestMessage->{'relationship'}->{'id1'}, $requestMessage->{'relationship'}->{'id2'}));
		}
		else
		{
			array_push($responseMessages, StorageMessage::makeRespondAddRelationship(false, $relationship->id, $requestMessage->{'relationship'}->{'id1'}, $requestMessage->{'relationship'}->{'id2'}));
		}
	}
	else if ($requestMessage->{'messageType'} == StorageMessage::RequestAddTag)
	{
		if (is_null($tag = $transaction->createTag($u, 
							$requestMessage->{'tag'}->{'name'}, 
							Visibility::All)))
		{
			array_push($responseMessages, StorageMessage::makeRespondAddTag(true, null, $requestMessage->{'tag'}->{'id'}));
		}
		else
		{
			array_push($responseMessages, StorageMessage::makeRespondAddTag(false, $tag->id, $requestMessage->{'tag'}->{'id'}));
		}
	}
	else if ($requestMessage->{'messageType'} == StorageMessage::RequestOverwriteNode)
	{ 
		$node = new MessNode($u, 
							$requestMessage->{'node'}->{'id'}, 
							new MessTag($u, $requestMessage->{'node'}->{'tagId'}), 
							$requestMessage->{'node'}->{'brief'}, 
							$requestMessage->{'node'}->{'thorough'}, 
							$requestMessage->{'node'}->{'posX'}, 
							$requestMessage->{'node'}->{'posY'},
							$requestMessage->{'node'}->{'main'});
		
		
		if (!$transaction->addObject($node))
		{
			array_push($responseMessages, StorageMessage::makeRespondOverwriteNode(true, "Failed to add node to transaction.  User has insufficient privileges.", $requestMessage->{'node'}->{'id'}));
		}
		elseif (!$node->update())
		{
			array_push($responseMessages, StorageMessage::makeRespondOverwriteNode(true, "Failed to update node.", $requestMessage->{'node'}->{'id'}));
		}
		else 
		{
			array_push($responseMessages, StorageMessage::makeRespondOverwriteNode(false, null, $requestMessage->{'node'}->{'id'}));
		}
	}
	else if ($requestMessage->{'messageType'} == StorageMessage::RequestOverwriteRelationship)
	{
		$relationship = new MessRelationship($u,
											$requestMessage->{'relationship'}->{'id'}, 
											new MessNode($u, $requestMessage->{'relationship'}->{'id1'}), 
											new MessNode($u, $requestMessage->{'relationship'}->{'id2'}), 
											$requestMessage->{'relationship'}->{'type'}, 
											$requestMessage->{'relationship'}->{'group'}, 
											$requestMessage->{'relationship'}->{'direction'},
											$requestMessage->{'relationship'}->{'thorough'});
		

		if (!$transaction->addObject($relationship))
		{
			array_push($responseMessages, StorageMessage::makeRespondOverwriteRelationship(true, "Failed to add relationship to transaction.  User has insufficient privileges.", $requestMessage->{'relationship'}->{'id'}));
		}
		elseif (!$relationship->update())
		{
			array_push($responseMessages, StorageMessage::makeRespondOverwriteRelationship(true, "Failed to update relationship.", $requestMessage->{'relationship'}->{'id'}));
		}	
		else 
		{
			array_push($responseMessages, StorageMessage::makeRespondOverwriteRelationship(false, null, $requestMessage->{'relationship'}->{'id'}));
		}
	}
	else if ($requestMessage->{'messageType'} == StorageMessage::RequestOverwriteTag)
	{
		$tag = new MessTag($u, 
							$requestMessage->{'tag'}->{'id'}, 
							new User($requestMessage->{'tag'}->{'creatorUserId'}),
							$requestMessage->{'tag'}->{'name'}, 
							$requestMessage->{'tag'}->{'visibility'});
							
		
		if (!$transaction->addObject($tag))
		{
			array_push($responseMessages, StorageMessage::makeRespondOverwriteTag(true, "Failed to add tag to transaction.  User has insufficient privileges.", $requestMessage->{'tag'}->{'id'}));
		}
		elseif (!$tag->update())
		{
			array_push($responseMessages, StorageMessage::makeRespondOverwriteTag(true, "Failed to update tag.", $requestMessage->{'tag'}->{'id'}));
		}
		else
		{
			array_push($responseMessages, StorageMessage::makeRespondOverwriteTag(false, null, $requestMessage->{'tag'}->{'id'}));
		}
	}
	else if ($requestMessage->{'messageType'} == StorageMessage::RequestRemoveNode)
	{
		$node = new MessNode($u, $requestMessage->{'node'}->{'id'});
		
		if (!$transaction->addObject($node))
		{
			array_push($responseMessages, StorageMessage::makeRespondRemoveNode(true, "Failed to add node to transaction.  User has insufficient privileges.", $requestMessage->{'node'}->{'id'}));
		}
		elseif (!$node->delete())
		{
			array_push($responseMessages, StorageMessage::makeRespondRemoveNode(true, "Failed to remove node.", $requestMessage->{'node'}->{'id'}));
		}
		else
		{
			array_push($responseMessages, StorageMessage::makeRespondRemoveNode(false, null, $requestMessage->{'node'}->{'id'}));
		}
	}
	else if ($requestMessage->{'messageType'} == StorageMessage::RequestRemoveRelationship)
	{
		$relationship = new MessRelationship($u, $requestMessage->{'relationship'}->{'id'});
		
		if (!$transaction->addObject($relationship))
		{	
			array_push($responseMessages, StorageMessage::makeRespondRemoveRelationship(true, "Failed to add relationship to transaction.  User has insufficient privileges.", $requestMessage->{'relationship'}->{'id'}));
		}
		elseif (!$relationship->delete())
		{
			array_push($responseMessages, StorageMessage::makeRespondRemoveRelationship(true, "Failed to remove relationship.", $requestMessage->{'relationship'}->{'id'}));
		}
		else
		{
			array_push($responseMessages, StorageMessage::makeRespondRemoveRelationship(false, null, $requestMessage->{'relationship'}->{'id'}));
		}
	}
	else if ($requestMessage->{'messageType'} == StorageMessage::RequestRemoveTag)
	{
		$tag = new MessTag($u, $requestMessage->{'tag'}->{'id'});
		
		if (!$transaction->addObject($tag))
		{
			array_push($responseMessages, StorageMessage::makeRespondRemoveTag(true, "Failed to add tag to transaction.  User has insufficient privileges.", $requestMessage->{'tag'}->{'id'}));
		}
		elseif (!$tag->delete())
		{
			array_push($responseMessages, StorageMessage::makeRespondRemoveTag(true, "Failed to remove tag.", $requestMessage->{'tag'}->{'id'}));
		}
		else
		{
			array_push($responseMessages, StorageMessage::makeRespondRemoveTag(false, null, $requestMessage->{'tag'}->{'id'}));
		}
	}
	else if ($requestMessage->{'messageType'} == StorageMessage::RequestGrantAccessTag)
	{
		$tag = new MessTag($u, $requestMessage->{'tag'}->{'id'});
		
		if (!$transaction->addObject($tag))
		{
			array_push($responseMessages, StorageMessage::makeRespondGrantAccessTag(true, "Failed to add tag to transaction.  User has insufficient privileges.", $requestMessage->{'tag'}->{'id'}, $requestMessage->{'userId'}));
		}		
		elseif (!$tag->grantAccess(new User($requestMessage->{'userId'})))
		{
			array_push($responseMessages, StorageMessage::makeRespondGrantAccessTag(true, "Failed to grant tag access.", $requestMessage->{'tag'}->{'id'}, $requestMessage->{'userId'}));
		}
		else
		{
			array_push($responseMessages, StorageMessage::makeRespondGrantAccessTag(false, null, $requestMessage->{'tag'}->{'id'}, $requestMessage->{'userId'}));
		}
	}
	else if ($requestMessage->{'messageType'} == StorageMessage::RequestRemoveAccessTag)
	{
		$tag = new MessTag($u, $requestMessage->{'tag'}->{'id'});
		
		if (!$transaction->addObject($tag))
		{
			array_push($responseMessages, StorageMessage::makeRespondRemoveAccessTag(true, "Failed to add tag to transaction.  User has insufficient privileges.", $requestMessage->{'tag'}->{'id'}, $requestMessage->{'userId'}));
		}	
		elseif (!$tag->removeAccess(new User($requestMessage->{'userId'})))
		{
			array_push($responseMessages, StorageMessage::makeRespondRemoveAccessTag(true, "Failed to remove tag access.", $requestMessage->{'tag'}->{'id'}, $requestMessage->{'userId'}));
		}
		else
		{
			array_push($responseMessages, StorageMessage::makeRespondRemoveAccessTag(false, null, $requestMessage->{'tag'}->{'id'}, $requestMessage->{'userId'}));
		}
	}
}

$retStr = json_encode($responseMessages);
if (!$retStr)
	die('Could not encode JSON return string (' . json_last_error() . ').');

if (!$transaction->commit())
	die('Failed to commit transaction.');
	
echo $retStr;

?>