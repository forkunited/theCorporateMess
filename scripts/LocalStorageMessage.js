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
function LocalStorageMessage() { }

LocalStorageMessage.SELECT_TAG = "selectTag";
LocalStorageMessage.DESELECT_TAG = "deselectTag";
LocalStorageMessage.SKIP_RETRIEVAL = "skipRetrieval";
LocalStorageMessage.NO_START_RETRIEVAL = "noStartRetrieval";
LocalStorageMessage.START_RETRIEVAL = "startRetrieval";
LocalStorageMessage.FINISH_RETRIEVAL = "finishRetrieval";
LocalStorageMessage.FINISH_RETRIEVAL_ADDITION = "finishRetrievalAddition";
LocalStorageMessage.RETRIEVE_ADD_TAG = "retrieveAddTag";
LocalStorageMessage.RETRIEVE_ADD_NODE = "retrieveAddNode";
LocalStorageMessage.RETRIEVE_ADD_RELATIONSHIP = "retrieveAddRelationship";
LocalStorageMessage.RETRIEVE_ADD_META_DATA = "retrieveAddMetaData";
LocalStorageMessage.REINITIALIZE_TAG = "reinitializeTag";
LocalStorageMessage.START_SAVE = "startSave";
LocalStorageMessage.SKIP_SAVE = "skipSave";
LocalStorageMessage.FINISH_SAVE = "finishSave";
LocalStorageMessage.LOCK_TAG = "lockTag";
LocalStorageMessage.UNLOCK_TAG = "unlockTag";

LocalStorageMessage.makeSelectTag = function(id) {
	return { 
		messageType : LocalStorageMessage.SELECT_TAG, 
		id : id
	};
}

LocalStorageMessage.makeDeselectTag = function(id, nodeIds, relatedUnselectedTagIds, name) {
	return { 
		messageType : LocalStorageMessage.DESELECT_TAG, 
		id : id,
		nodeIds : nodeIds,
		relatedUnselectedTagIds : relatedUnselectedTagIds,
		name : name
	};
}

LocalStorageMessage.makeSkipRetrieval = function() {
	return { 
		messageType : LocalStorageMessage.SKIP_RETRIEVAL
	};
}

LocalStorageMessage.makeNoStartRetrieval = function() {
	return { 
		messageType : LocalStorageMessage.NO_START_RETRIEVAL
	};
}

LocalStorageMessage.makeStartRetrieval = function() {
	return { 
		messageType : LocalStorageMessage.START_RETRIEVAL
	};
}

LocalStorageMessage.makeFinishRetrieval = function() {
	return { 
		messageType : LocalStorageMessage.FINISH_RETRIEVAL
	};
}

LocalStorageMessage.makeFinishRetrievalAddition = function() {
	return {
		messageType : LocalStorageMessage.FINISH_RETRIEVAL_ADDITION
	};
}

LocalStorageMessage.makeRetrieveAddTag = function(tag) {
	return { 
		messageType : LocalStorageMessage.RETRIEVE_ADD_TAG,
		tag : tag
	};
}

LocalStorageMessage.makeRetrieveAddNode = function(node) {
	return { 
		messageType : LocalStorageMessage.RETRIEVE_ADD_NODE,
		node : node
	};
}

LocalStorageMessage.makeRetrieveAddRelationship = function(relationship) {
	return { 
		messageType : LocalStorageMessage.RETRIEVE_ADD_RELATIONSHIP,
		relationship : relationship
	};
}

LocalStorageMessage.makeRetrieveAddMetaData = function(metaData) {
	return { 
		messageType : LocalStorageMessage.RETRIEVE_ADD_META_DATA,
		metaData : metaData
	};
}

LocalStorageMessage.makeReinitializeTag = function(id, nodeIds) {
	return { 
		messageType : LocalStorageMessage.REINITIALIZE_TAG,
		id : id,
		nodeIds : nodeIds
	};
}

LocalStorageMessage.makeStartSave = function() {
	return { 
		messageType : LocalStorageMessage.START_SAVE
	};
}

LocalStorageMessage.makeSkipSave = function() {
	return { 
		messageType : LocalStorageMessage.SKIP_SAVE
	};
}

LocalStorageMessage.makeFinishSave = function(storageMessages) {
	return { 
		messageType : LocalStorageMessage.FINISH_SAVE,
		storageMessages : storageMessages
	};
}

LocalStorageMessage.makeLockTag = function(id, lock) {
	return { 
		messageType : LocalStorageMessage.LOCK_TAG,
		id : id,
		lock : lock
	};
}

LocalStorageMessage.makeUnlockTag = function(id, lock) {
	return { 
		messageType : LocalStorageMessage.UNLOCK_TAG,
		id : id,
		lock : lock
	};
}