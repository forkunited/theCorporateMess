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
function StoreMessGraph() {
	var that = this; 
	
	this.STORE_SCRIPT = 'server/storeMessGraph.php';
	
	var requestMessages = [];
	
	this.store = function(fnResponseMessages) {
		if (requestMessages.length == 0) {
			fnResponseMessages([]);
			return;
		}
	
		Util.sendJSONPostRequest(this.STORE_SCRIPT, 
								fnResponseMessages, 
								"messages=" + JSON.stringify(requestMessages));

		requestMessages = [];
	}
	
	this.addNode = function(node) {
		requestMessages.push(StorageMessage.makeRequestAddNode(node));
	}
	
	this.addRelationship = function(relationship) {
		requestMessages.push(StorageMessage.makeRequestAddRelationship(relationship));
	}
	
	this.addTag = function(tag) {
		requestMessages.push(StorageMessage.makeRequestAddTag(tag));
	}
	
	this.overwriteNode = function(node) {
		requestMessages.push(StorageMessage.makeRequestOverwriteNode(node));
	}
	
	this.overwriteRelationship = function(relationship) {
		requestMessages.push(StorageMessage.makeRequestOverwriteRelationship(relationship));
	}
	
	this.overwriteTag = function(tag) {
		requestMessages.push(StorageMessage.makeRequestOverwriteTag(tag));
	}
	
	this.removeNode = function(node) {
		requestMessages.push(StorageMessage.makeRequestRemoveNode(node));
	}
	
	this.removeRelationship = function(relationship) {
		requestMessages.push(StorageMessage.makeRequestRemoveRelationship(relationship));
	}
	
	this.removeTag = function(tag) {
		requestMessages.push(StorageMessage.makeRequestRemoveTag(tag));
	}
	
	this.grantAccessTag = function(tag, userId) {
		requestMessages.push(StorageMessage.makeRequestGrantAccessTag(tag, userId));
	}
	
	this.removeAccessTag = function(tag, userId) {
		requestMessages.push(StorageMessage.makeRequestRemoveAccessTag(tag, userId));
	}
}
