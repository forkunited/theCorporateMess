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
function StorageMessage() { }

StorageMessage.REQUEST_RETRIEVE_USERS = "requestRetrieveUsers";
StorageMessage.RESPOND_RETRIEVE_USERS = "respondRetrieveUsers";
StorageMessage.REQUEST_RETRIEVE_MESSGRAPH = "requestRetrieveMessGraph",
StorageMessage.RESPOND_RETRIEVE_MESSGRAPH = "respondRetrieveMessGraph",
StorageMessage.REQUEST_ADD_NODE = "requestAddNode";
StorageMessage.RESPOND_ADD_NODE = "respondAddNode";
StorageMessage.REQUEST_ADD_RELATIONSHIP = "requestAddRelationship";
StorageMessage.RESPOND_ADD_RELATIONSHIP = "respondAddRelationship";
StorageMessage.REQUEST_ADD_TAG = "requestAddTag";
StorageMessage.RESPOND_ADD_TAG = "respondAddTag";
StorageMessage.REQUEST_OVERWRITE_NODE = "requestOverwriteNode";
StorageMessage.RESPOND_OVERWRITE_NODE = "respondOverwriteNode";
StorageMessage.REQUEST_OVERWRITE_RELATIONSHIP = "requestOverwriteRelationship";
StorageMessage.RESPOND_OVERWRITE_RELATIONSHIP = "respondOverwriteRelationship";
StorageMessage.REQUEST_OVERWRITE_TAG = "requestOverwriteTag";
StorageMessage.RESPOND_OVERWRITE_TAG = "respondOverwriteTag";
StorageMessage.REQUEST_REMOVE_NODE = "requestRemoveNode";
StorageMessage.RESPOND_REMOVE_NODE = "respondRemoveNode";
StorageMessage.REQUEST_REMOVE_RELATIONSHIP = "requestRemoveRelationship";
StorageMessage.RESPOND_REMOVE_RELATIONSHIP = "respondRemoveRelationship";
StorageMessage.REQUEST_REMOVE_TAG = "requestRemoveTag";
StorageMessage.RESPOND_REMOVE_TAG = "respondRemoveTag";
StorageMessage.REQUEST_GRANT_ACCESS_TAG = "requestGrantAccessTag";
StorageMessage.RESPOND_GRANT_ACCESS_TAG = "respondGrantAccessTag";
StorageMessage.REQUEST_REMOVE_ACCESS_TAG = "requestRemoveAccessTag";
StorageMessage.RESPOND_REMOVE_ACCESS_TAG = "respondRemoveAccessTag";
	
StorageMessage.makeRequestRetrieveUsers = function(queryType, params) {
	return { 
		messageType : StorageMessage.REQUEST_RETRIEVE_USERS, 
		queryType : queryType,
		params : params
	};
}
	
StorageMessage.makeRespondRetrieveUsers = function(users, queryType, params) {
	return { 
		messageType : StorageMessage.RESPOND_RETRIEVE_USERS, 
		users : users,
		queryType : queryType,
		params : params
	};
}

StorageMessage.makeRequestRetrieveMessGraph = function(queryType, params) {
	return { 
		messageType : StorageMessage.REQUEST_RETRIEVE_MESSGRAPH, 
		queryType : queryType,
		params : params
	};
}

StorageMessage.makeRespondRetrieveMessGraph = function(messGraph) {
	return { 
		messageType : StorageMessage.RESPOND_RETRIEVE_MESSGRAPH, 
		messGraph : messGraph
	};
}

StorageMessage.makeRequestAddNode = function(node) {
	return { 
		messageType : StorageMessage.REQUEST_ADD_NODE, 
		node : node
	};
}

StorageMessage.makeRespondAddNode = function(failure, id, tempId) {
	return { 
		messageType : StorageMessage.RESPOND_ADD_NODE, 
		failure : failure,
		id : id,
		tempId : tempId
	};
}

StorageMessage.makeRequestAddRelationship = function(relationship) {
	return { 
		messageType : StorageMessage.REQUEST_ADD_RELATIONSHIP, 
		relationship : relationship
	};
}

StorageMessage.makeRespondAddRelationship = function(failure, id, id1, id2) {
	return { 
		messageType : StorageMessage.RESPOND_ADD_RELATIONSHIP, 
		failure : failure,
		id : id,
		id1 : id1,
		id2 : id2, 
	};
}

StorageMessage.makeRequestAddTag = function(tag) {
	return { 
		messageType : StorageMessage.REQUEST_ADD_TAG, 
		tag : tag
	};
}

StorageMessage.makeRespondAddTag = function(failure, id, tempId) {
	return { 
		messageType : StorageMessage.RESPOND_ADD_TAG, 
		failure : failure,
		id : id,
		tempId : tempId
	};
}

StorageMessage.makeRequestOverwriteNode = function(node) {
	return { 
		messageType : StorageMessage.REQUEST_OVERWRITE_NODE, 
		node : node
	};
}

StorageMessage.makeRespondOverwriteNode = function(failure, failureMessage, id) {
	return { 
		messageType : StorageMessage.RESPOND_OVERWRITE_NODE, 
		failure : failure,
		failureMessage : failureMessage,
		id : id
	};
}

StorageMessage.makeRequestOverwriteRelationship = function(relationship) {
	return { 
		messageType : StorageMessage.REQUEST_OVERWRITE_RELATIONSHIP, 
		relationship : relationship
	};
}

StorageMessage.makeRespondOverwriteRelationship = function(failure, failureMessage, id) {
	return { 
		messageType : StorageMessage.RESPOND_OVERWRITE_RELATIONSHIP, 
		failure : failure,
		failureMessage : failureMessage,
		id : id
	};
}

StorageMessage.makeRequestOverwriteTag = function(tag) {
	return { 
		messageType : StorageMessage.REQUEST_OVERWRITE_TAG, 
		tag : tag
	};
}

StorageMessage.makeRespondOverwriteTag = function(failure, failureMessage, id) {
	return { 
		messageType : StorageMessage.RESPOND_OVERWRITE_TAG, 
		failure : failure,
		failureMessage : failureMessage,
		id : id
	};
}

StorageMessage.makeRequestRemoveNode = function(node) {
	return { 
		messageType : StorageMessage.REQUEST_REMOVE_NODE, 
		node : node
	};
}

StorageMessage.makeRespondRemoveNode = function(failure, failureMessage, id) {
	return { 
		messageType : StorageMessage.RESPOND_REMOVE_NODE, 
		failure : failure,
		failureMessage : failureMessage,
		id : id
	};
}

StorageMessage.makeRequestRemoveRelationship = function(relationship) {
	return { 
		messageType : StorageMessage.REQUEST_REMOVE_RELATIONSHIP, 
		relationship :relationship
	};
}

StorageMessage.makeRespondRemoveRelationship = function(failure, failureMessage, id) {
	return { 
		messageType : StorageMessage.RESPOND_REMOVE_RELATIONSHIP, 
		failure : failure,
		failureMessage : failureMessage,
		id : id
	};
}

StorageMessage.makeRequestRemoveTag = function(tag) {
	return { 
		messageType : StorageMessage.REQUEST_REMOVE_TAG, 
		tag : tag
	};
}

StorageMessage.makeRespondRemoveTag = function(failure, failureMessage, id) {
	return { 
		messageType : StorageMessage.RESPOND_REMOVE_TAG, 
		failure : failure,
		failureMessage : failureMessage,
		id : id
	};
}

StorageMessage.makeRequestGrantAccessTag = function(tag, userId) {
	return { 
		messageType : StorageMessage.REQUEST_GRANT_ACCESS_TAG, 
		tag : tag,
		userId : userId
	};
}

StorageMessage.makeRespondGrantAccessTag = function(failure, failureMessage, tagId, userId) {
	return { 
		messageType : StorageMessage.RESPOND_GRANT_ACCESS_TAG, 
		failure : failure, 
		failureMessage : failureMessage, 
		tagId : tagId, 
		userId : userId
	};
}

StorageMessage.makeRequestRemoveAccessTag = function(tag, userId) {
	return { 
		messageType : StorageMessage.REQUEST_REMOVE_ACCESS_TAG, 
		tag : tag,
		userId : userId
	};
}

StorageMessage.makeRespondRemoveAccessTag = function(failure, failureMessage, tagId, userId) {
	return { 
		messageType : StorageMessage.RESPOND_REMOVE_ACCESS_TAG, 
		failure : failure, 
		failureMessage : failureMessage, 
		tagId : tagId, 
		userId : userId
	};
}