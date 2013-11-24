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

class StorageMessage
{
	const RequestRetrieveUsers = "requestRetrieveUsers";
	const RespondRetrieveUsers = "respondRetrieveUsers";
	const RequestRetrieveMessGraph = "requestRetrieveMessGraph";
	const RespondRetrieveMessGraph = "respondRetrieveMessGraph";
	const RequestAddNode = "requestAddNode";
	const RespondAddNode = "respondAddNode";
	const RequestAddRelationship = "requestAddRelationship";
	const RespondAddRelationship = "respondAddRelationship";
	const RequestAddTag = "requestAddTag";
	const RespondAddTag = "respondAddTag";
	const RequestOverwriteNode = "requestOverwriteNode";
	const RespondOverwriteNode = "respondOverwriteNode";
	const RequestOverwriteRelationship = "requestOverwriteRelationship";
	const RespondOverwriteRelationship = "respondOverwriteRelationship";
	const RequestOverwriteTag = "requestOverwriteTag";
	const RespondOverwriteTag = "respondOverwriteTag";
	const RequestRemoveNode = "requestRemoveNode";
	const RespondRemoveNode = "respondRemoveNode";
	const RequestRemoveRelationship = "requestRemoveRelationship";
	const RespondRemoveRelationship = "respondRemoveRelationship";
	const RequestRemoveTag = "requestRemoveTag";
	const RespondRemoveTag = "respondRemoveTag";
	const RequestGrantAccessTag = "requestGrantAccessTag";
	const RespondGrantAccessTag = "respondGrantAccessTag";
	const RequestRemoveAccessTag = "requestRemoveAccessTag";
	const RespondRemoveAccessTag = "respondRemoveAccessTag";
	
	public static function makeRequestRetrieveUsers($queryType, $params) {
		return array( 
			"messageType" => StorageMessage::RequestRetrieveUsers, 
			"queryType" => $queryType,
			"params" => $params
		);
	}
	
	public static function makeRespondRetrieveUsers($users, $queryType, $params) {
		return array( 
			"messageType" => StorageMessage::RespondRetrieveUsers, 
			"users" => $users,
			"queryType" => $queryType,
			"params" => $params
		);
	}
	
	public static function makeRequestRetrieveMessGraph($queryType, $params) {
		return array( 
			"messageType" => StorageMessage::RequestRetrieveMessGraph, 
			"queryType" => $queryType,
			"params" => $params
		);
	}
	
	public static function makeRespondRetrieveMessGraph($messGraph) {
		return array( 
			"messageType" => StorageMessage::RespondRetrieveMessGraph, 
			"messGraph" => $messGraph
		);
	}
	
	public static function makeRequestAddNode($node) {
		return array( 
			"messageType" => StorageMessage::RequestAddNode, 
			"node" => $node
		);
	}
	
	public static function makeRespondAddNode($failure, $id, $tempId) {
		return array( 
			"messageType" => StorageMessage::RespondAddNode, 
			"failure" => $failure,
			"id" => $id,
			"tempId" => $tempId
		);
	}
	
	public static function makeRequestAddRelationship($relationship) {
		return array( 
			"messageType" => StorageMessage::RequestAddRelationship, 
			"relationship" => $relationship
		);
	}
	
	public static function makeRespondAddRelationship($failure, $id, $id1, $id2) {
		return array( 
			"messageType" => StorageMessage::RespondAddRelationship, 
			"failure" => $failure,
			"id" => $id,
			"id1" => $id1,
			"id2" => $id2, 
		);
	}
	
	public static function makeRequestAddTag($tag) {
		return array( 
			"messageType" => StorageMessage::RequestAddTag, 
			"tag" => $tag
		);
	}
	
	public static function makeRespondAddTag($failure, $id, $tempId) {
		return array( 
			"messageType" => StorageMessage::RespondAddTag, 
			"failure" => $failure,
			"id" => $id,
			"tempId" => $tempId
		);
	}
	
	public static function makeRequestOverwriteNode($node) {
		return array( 
			"messageType" => StorageMessage::RequestOverwriteNode, 
			"node" => $node
		);
	}
	
	public static function makeRespondOverwriteNode($failure, $failureMessage, $id) {
		return array( 
			"messageType" => StorageMessage::RespondOverwriteNode, 
			"failure" => $failure,
			"failureMessage" => $failureMessage,
			"id" => $id
		);
	}
	
	public static function makeRequestOverwriteRelationship($relationship) {
		return array( 
			"messageType" => StorageMessage::RequestOverwriteRelationship, 
			"relationship" => $relationship
		);
	}
	
	public static function makeRespondOverwriteRelationship($failure, $failureMessage, $id) {
		return array( 
			"messageType" => StorageMessage::RespondOverwriteRelationship, 
			"failure" => $failure,
			"failureMessage" => $failureMessage,
			"id" => $id
		);
	}
	
	public static function makeRequestOverwriteTag($tag) {
		return array( 
			"messageType" => StorageMessage::RequestOverwriteTag, 
			"tag" => $tag
		);
	}
	
	public static function makeRespondOverwriteTag($failure, $failureMessage, $id) {
		return array( 
			"messageType" => StorageMessage::RespondOverwriteTag, 
			"failure" => $failure,
			"failureMessage" => $failureMessage,
			"id" => $id
		);
	}
	
	public static function makeRequestRemoveNode($node) {
		return array( 
			"messageType" => StorageMessage::RequestRemoveNode, 
			"node" => $node
		);
	}
	
	public static function makeRespondRemoveNode($failure, $failureMessage, $id) {
		return array( 
			"messageType" => StorageMessage::RespondRemoveNode, 
			"failure" => $failure,
			"failureMessage" => $failureMessage,
			"id" => $id
		);
	}
	
	public static function makeRequestRemoveRelationship($relationship) {
		return array( 
			"messageType" => StorageMessage::RequestRemoveRelationship, 
			"relationship" => $relationship
		);
	}
	
	public static function makeRespondRemoveRelationship($failure, $failureMessage, $id) {
		return array( 
			"messageType" => StorageMessage::RespondRemoveRelationship, 
			"failure" => $failure,
			"failureMessage" => $failureMessage,
			"id" => $id
		);
	}
	
	public static function makeRequestRemoveTag($tag) {
		return array( 
			"messageType" => StorageMessage::RequestRemoveTag, 
			"tag" => $tag
		);
	}
	
	public static function makeRespondRemoveTag($failure, $failureMessage, $id) {
		return array( 
			"messageType" => StorageMessage::RespondRemoveTag, 
			"failure" => $failure,
			"failureMessage" => $failureMessage,
			"id" => $id
		);
	}
	
	public static function makeRequestGrantAccessTag($tag, $userId) {
		return array( 
			"messageType" => StorageMessage::RequestGrantAccessTag, 
			"tag" => $tag,
			"userId" => $userId
		);
	}
	
	public static function makeRespondGrantAccessTag($failure, $failureMessage, $tagId, $userId) {
		return array( 
			"messageType" => StorageMessage::RespondGrantAccessTag, 
			"failure" => $failure, 
			"failureMessage" => $failureMessage, 
			"tagId" => $tagId, 
			"userId" => $userId
		);
	}
	
	public static function makeRequestRemoveAccessTag($tag, $userId) {
		return array( 
			"messageType" => StorageMessage::RequestRemoveAccessTag, 
			"tag" => $tag,
			"userId" => $userId
		);
	}
	
	public static function makeRespondRemoveAccessTag($failure, $failureMessage, $tagId, $userId) {
		return array( 
			"messageType" => StorageMessage::RespondRemoveAccessTag, 
			"failure" => $failure, 
			"failureMessage" => $failureMessage, 
			"tagId" => $tagId, 
			"userId" => $userId
		);
	}
}

?>