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
function MessStore(currentUser) {
	var that = this;  
	
	/* Represents that a tag has never been retrieved */
	this.RETRIEVAL_TIME_NEVER = 0;
	
	/* States representing what needs to be retrieved */
	this.RETRIEVAL_STATE_NONE = 0;
	this.RETRIEVAL_STATE_GRAPH = 1;
	this.RETRIEVAL_STATE_SKIPPED = 2;
	
	/* States representing what needs to be saved */
	this.SAVE_STATE_NONE = 0;
	this.SAVE_STATE_SAVING = 1;
	this.SAVE_STATE_SKIPPED = 2;

	/* Different states representing different reasons for which
	 * an entity can require saving
	 */
	this.SAVE_STATE_UNSAVED_NONE = 0;
	this.SAVE_STATE_UNSAVED_EDIT = 1;
	this.SAVE_STATE_UNSAVED_ADD = 2;
	this.SAVE_STATE_UNSAVED_REMOVE = 3;
	
	/* Vertex stuff */
	this.GRAPH_RETRIEVAL_INTERVAL = 5000;
	this.AUTO_SAVE_INTERVAL = 5000;
	
	/* Tags */
	this.MAX_NUM_SELECTED_TAGS = 10000;
	
	/* Sends storage messages to the server */
	var store = new StoreMessGraph();

	/* Sends retrieval messages to the server */
	var retrieve = new RetrieveMessGraph();
	
	/* Stores a selected tag subgraph of the graph on the server */
	var selectedGraph = new MessGraph();
	var numSelectedTags = 0;
	
	/* Maps selected tag ids to local tag info 
	 * Info includes the following properties
	 * 	- color				(color representing the tag locally)
	 * 	- retrievalTime 	(last time the graph for the tag was retrieved)
	 *	- lock				(cannot be selected or deselected when there is a lock)
	 */
	var selectedTags = {};
	
	/* Tag under which modifications are presently stored */
	var mainSelectedTagId = undefined;
	
	/* Modified objects */
	var unsavedTags = {};
	var unsavedNodes = {};
	var unsavedRelationships = {};
	var savingTags = {};
	var savingNodes = {};
	var savingRelationships = {};
	
	/* Keep track of errors
	 * Note that there is currently a race-condition where there will be
	 * an error if a relationship to another person's graph is modified,
	 * around the same time that the other person deletes a node incident
	 * to that relationship.  This isn't such a big deal for now except that 
	 * the presence of the error will be misleading to the user.
	 */
	var errorTags = {};
	var errorNodes = {};
	var errorRelationships = {};
	
	var retrievalState = this.RETRIEVAL_STATE_NONE; 
	var saveState = this.SAVE_STATE_NONE;
	
	var localMessageHandlers = [];
	
	this.init = function() {
		// HACK: No auto retrieval for now...
		//window.setInterval(retrieveGraph, that.GRAPH_RETRIEVAL_INTERVAL);
		//window.setInterval(that.save, that.AUTO_SAVE_INTERVAL);
	}
	
	this.addLocalMessageHandler = function(handlerFn) {
		localMessageHandlers.push(handlerFn);
	}
	
	function runLocalMessageHandlers(message) {
		for (var i = 0; i < localMessageHandlers.length; i++)
			localMessageHandlers[i](message);
	}
	
	function buildRelationshipId(id1, id2) {
		if (id1.localeCompare(id2) < 0)
			return id1 + "_" + id2;
		else 
			return id2 + "_" + id1;
	}
	
	function extractRelationshipNodeIds(id) {
		return id.split("_");
	}
	
	/* Miscellaneous Getters */
	
	this.getTagColor = function(id) {
		if (!(id in selectedTags))
			return undefined;
		return selectedTags[id].color;
	}
	
	this.getUnsavedTags = function() {
		var retTags = [];
		for (var t in unsavedTags)
			retTags.push(t);
		return retTags;
	}
	
	this.getUnsavedNodes = function() {
		var retNodes = [];
		for (var n in unsavedNodes)
			retNodes.push(n);
		return retNodes;
	}

	this.getUnsavedRelationships = function() {
		var retRelationships = [];
		for (var id in unsavedRelationships)
			retRelationships.push(unsavedRelationships[id].obj);
		return retRelationships;
	}
	
	this.getSavingTags = function() {
		var retTags = [];
		for (var t in savingTags)
			retTags.push(t);
		return retTags;
	}
	
	this.getSavingNodes = function() {
		var retNodes = [];
		for (var n in savingNodes)
			retNodes.push(n);
		return retNodes;
	}
	
	this.getSavingRelationships = function() {
		var retRelationships = [];
		for (var id in savingRelationships) {
			retRelationships.push(savingRelationships[id].obj);
		}
		return retRelationships;
	}
	
	this.getErrorTags = function() {
		var retTags = [];
		for (var t in errorTags)
			retTags.push(t);
		return retTags;
	}
	
	this.getErrorNodes = function() {
		var retNodes = [];
		for (var n in errorNodes)
			retNodes.push(n);
		return retNodes;
	}
	
	this.getErrorRelationships = function() {
		var retRelationships = [];
		for (var id in errorRelationships)
			retRelationships.push(errorRelationships[id].obj);
		return retRelationships;
	}
	
	this.getRetrievalState = function() {
		return retrievalState;
	}
	
	this.getNode = function(id) {
		if (!selectedGraph.hasNode(id))
			return undefined;
		return selectedGraph.getNode(id);
	}
	
	this.getNodeRelationships = function(id) {
		if (!selectedGraph.hasNode(id))
			return undefined;
		return selectedGraph.getNodeRelationships(id);
	}
	
	this.getRelationship = function(id1, id2) {
		if (!selectedGraph.hasRelationship(id1, id2))
			return undefined;
		return selectedGraph.getRelationship(id1, id2);
	}
	
	this.getTag = function(id) {
		if (!selectedGraph.hasTag(id))
			return undefined;
		return selectedGraph.getTag(id);
	}
	
	this.getTagRelatedNodeIds = function(id, onlySelected) {
		if (!selectedGraph.hasTag(id))
			return undefined;
		return selectedGraph.getTagRelatedNodeIds(id, onlySelected);
	}
	
	/* Retrieval */
	
	this.selectMainTag = function(id) {
		if (!(id in selectedTags))
			return false;
		if (!selectedGraph.hasTag(id))
			return false;
		if (!selectedGraph.getTag(id).writeAccess)
			return false;
		
		mainSelectedTagId = id;
			
		return true;
	}
	
	this.getMainTag = function() {
		if (!mainSelectedTagId)
			return undefined;
			
		return selectedGraph.getTag(mainSelectedTagId);
	}
	
	this.selectTag = function(id) {
		if (id in selectedTags)
			return;
		if (numSelectedTags >= that.MAX_NUM_SELECTED_TAGS)
			return;
		numSelectedTags++;
		
		selectedTags[id] =
		{
			retrievalTime : that.RETRIEVAL_TIME_NEVER,
			color : RandomColors.next(),
			lock : undefined
		};
		
		runLocalMessageHandlers(LocalStorageMessage.makeSelectTag(id));
		
		retrieveGraph();
	}
	
	this.deselectTag = function(id) {
		if (!(id in selectedTags) || selectedTags[id].lock)
			return;
			
		numSelectedTags--;	
			
		var nodeIds = selectedGraph.getNodeIdsByTagId(id);
		if (!nodeIds)
			nodeIds = [];
		
		delete selectedTags[id];
		
		var relatedUnselectedTagIds = selectedGraph.deselectTag(id);
		
		runLocalMessageHandlers(LocalStorageMessage.makeDeselectTag(id, nodeIds, relatedUnselectedTagIds));
		
		if (mainSelectedTagId == id)
			mainSelectedTagId = undefined;
	}
	
	this.tagSelected = function(id) {
		return (id in selectedTags) && selectedGraph.hasTag(id) && selectedGraph.getTag(id).selected;
	}
	
	function retrieveGraph() {
		 // Don't retrieve while saving because it messes things up if newly added vertices are retrieved
		 // Or if old stuff is retrieved when it is currently being overwritten by a save
		if (retrievalState == that.RETRIEVAL_STATE_GRAPH 
		||	retrievalState == that.RETRIEVAL_STATE_SKIPPED
		||  saveState == that.SAVE_STATE_SAVING) {
			retrievalState = that.RETRIEVAL_STATE_SKIPPED;
			runLocalMessageHandlers(LocalStorageMessage.makeSkipRetrieval());
			return;
		}
		
		var tagsToRetrieve = [];
		for (var tagId in selectedTags) {
			if (/*!selectedGraph.hasTag(tagId) 
				|| selectedGraph.getTag(tagId).creatorUserId != currentUser 
				|| HACK: Only retrieve selected once */selectedTags[tagId].retrievalTime == that.RETRIEVAL_TIME_NEVER) {
				
				tagsToRetrieve.push(
				{
					id : tagId,
					updatedDate : selectedTags[tagId].retrievalTime,
					compactionDate : (selectedGraph.hasTag(tagId)) ? selectedGraph.getTag(tagId).compactionDate : 0
				});
				
				selectedTags[tagId].retrievalTime = Util.currentTime();
			}
		}
		
		if (tagsToRetrieve.length == 0) {
			retrievalState = that.RETRIEVAL_STATE_NONE; 
			runLocalMessageHandlers(LocalStorageMessage.makeNoStartRetrieval());
			return;
		}
		
		retrieve.graphAllByTags(retrieveGraphHandle, tagsToRetrieve);
		
		retrievalState = that.RETRIEVAL_STATE_GRAPH; 
		runLocalMessageHandlers(LocalStorageMessage.makeStartRetrieval());
	}
	
	function retrieveGraphHandle(storageMessages) {
		if (saveState == that.SAVE_STATE_SKIPPED) {
			that.save();
		}

		if (retrievalState == that.RETRIEVAL_STATE_SKIPPED) {
			retrievalState = that.RETRIEVAL_STATE_NONE;
			retrieveGraph();
		} else {
			retrievalState = that.RETRIEVAL_STATE_NONE;
			runLocalMessageHandlers(LocalStorageMessage.makeFinishRetrieval());
		}

		if (storageMessages.length == 0 || storageMessages[0].messageType != StorageMessage.RESPOND_RETRIEVE_MESSGRAPH)
			return;
		
		var graphObjs = storageMessages[0].messGraph;

		for (var i = 0; i < graphObjs.length; i++) {
			var graphObj = graphObjs[i];
			if (graphObj.objType == selectedGraph.OBJ_TYPE_TAG) {
				var addedTag = false;
				if (selectedGraph.hasTag(graphObj.tag.id)) {
					var localTag = selectedGraph.getTag(graphObj.tag.id);
					if (graphObj.tag.id in selectedTags && graphObj.tag.compactionDate > localTag.compactionDate) {
						/* Reinitialized graph after compaction */
						localTag.compactionDate = graphObj.tag.compactionDate;
						runLocalMessageHandlers(LocalStorageMessage.makeReinitializeTag(localTag.id, selectedGraph.getNodeIdsByTagId(localTag.id)));
						selectedGraph.removeNodesByTagId(localTag.id);
					}
				
					/* Overwrite other user's tag data */
					if (currentUser != graphObj.tag.creatorUserId) {
						addedTag = selectedGraph.addTag(graphObj.tag, (graphObj.tag.id in selectedTags));
					} else if (graphObj.tag.id in selectedTags)
						addedTag = selectedGraph.selectTag(graphObj.tag.id);
				} else {
					addedTag = selectedGraph.addTag(graphObj.tag, (graphObj.tag.id in selectedTags));
				}
				
				if (addedTag)
					runLocalMessageHandlers(LocalStorageMessage.makeRetrieveAddTag(graphObj.tag));
			} else if (graphObj.objType == selectedGraph.OBJ_TYPE_NODE) {
				if (selectedGraph.addNode(graphObj.node)) {
					runLocalMessageHandlers(LocalStorageMessage.makeRetrieveAddNode(graphObj.node));
					if (graphObj.node.brief.indexOf("[") >= 0 && graphObj.node.brief.indexOf("]") >= 0) { 
						// HACK: Check if node relationships were not included from server.  If they aren't,
						// then 'brief' will contain a string of the form '[X neightbors]'
						var relationships = selectedGraph.getNodeRelationships(graphObj.node.id);
						for (var id2 in relationships)
							runLocalMessageHandlers(LocalStorageMessage.makeRetrieveAddRelationship(relationships[id2]));
					}
				}
			} else if (graphObj.objType == selectedGraph.OBJ_TYPE_RELATIONSHIP) {
				selectedGraph.setRelationship(graphObj.relationship);
				runLocalMessageHandlers(LocalStorageMessage.makeRetrieveAddRelationship(graphObj.relationship));
			} else if (graphObj.objType == selectedGraph.OBJ_TYPE_META_DATA) {
				selectedGraph.setMetaData(graphObj.metaData);
				runLocalMessageHandlers(LocalStorageMessage.makeRetrieveAddMetaData(graphObj.metaData));
			}
		}
		
		/* FIXME: This is a hack... Removes all unselected tags that are disconnected from the rest of the graph
		* Avoids a race condition where tags disconnected tags are added back in after they are disconnected
		*/
		var tagIds = selectedGraph.getTagIds();
		for (var i = 0; i < tagIds.length; i++) {
			if (!(tagIds[i] in selectedTags)) {
				selectedGraph.deselectTag(tagIds[i]);
				if (!selectedGraph.hasTag(tagIds[i]))
					runLocalMessageHandlers(LocalStorageMessage.makeDeselectTag(tagIds[i], [], []));
			}
		}
		
		runLocalMessageHandlers(LocalStorageMessage.makeFinishRetrievalAddition());
	}
	
	/* Storage stuff */
	
	this.save = function() {
		return; // HACK: No saves...
	
		if (saveState == that.SAVE_STATE_SAVING) {
			runLocalMessageHandlers(LocalStorageMessage.makeSkipSave());
			return;
		}

		saveState = that.SAVE_STATE_SAVING;
		
		if (retrievalState == that.RETRIEVAL_STATE_GRAPH) {
			runLocalMessageHandlers(LocalStorageMessage.makeSkipSave());
			saveState = that.SAVE_STATE_SKIPPED;
			return;
		}
		
		/* Perform additions and edits in order of tags, nodes, relationships,
		 * and then perform removals in opposite order (relationships, nodes,
		 * tags).  This ordering ensures that the tags exist which relationships
		 * depend on, and the tags exist which nodes depend on when their modifications
		 * occur.
		 *
		 * Note that this assumes that added tags are always saved before nodes are added
		 * to their graphs. 
		 */
		 
		 /* Add and edit tags */
		for (var tagId in unsavedTags) {
			if (unsavedTags[tagId].saveType == that.SAVE_STATE_UNSAVED_ADD || unsavedTags[tagId].saveType == that.SAVE_STATE_UNSAVED_EDIT) {
				var storageMessage = unsavedTags[tagId].obj;
				if (storageMessage.messageType == StorageMessage.REQUEST_GRANT_ACCESS_TAG) {
					store.grantAccessTag(storageMessage.tag, storageMessage.userId);
				} else if (storageMessage.messageType == StorageMessage.REQUEST_REMOVE_ACCESS_TAG) {
					store.removeAccessTag(storageMessage.tag, storageMessage.userId);
				} else if (storageMessage.messageType == StorageMessage.REQUEST_OVERWRITE_TAG) {
					store.overwriteTag(storageMessage.tag);
				} else if (storageMessage.messageType == StorageMessage.REQUEST_ADD_TAG) {
					store.addTag(storageMessage.tag);
				} 
				
				savingTags[tagId] = unsavedTags[tagId];
				delete unsavedTags[tagId];
			}
		}

		/* Add and edit nodes */
		for (var nodeId in unsavedNodes) {
			if (unsavedNodes[nodeId].saveType == that.SAVE_STATE_UNSAVED_ADD) {
				store.addNode(unsavedNodes[nodeId].obj);
				savingNodes[nodeId] = unsavedNodes[nodeId];
				delete unsavedNodes[nodeId];
			} else if (unsavedNodes[nodeId].saveType == that.SAVE_STATE_UNSAVED_EDIT) {
				store.overwriteNode(unsavedNodes[nodeId].obj);
				savingNodes[nodeId] = unsavedNodes[nodeId];
				delete unsavedNodes[nodeId];
			}
		}
		
		/* Add, edit, and remove relationships */
		for (var relationshipId in unsavedRelationships) {
			if (unsavedRelationships[relationshipId].saveType == that.SAVE_STATE_UNSAVED_ADD) {
				store.addRelationship(unsavedRelationships[relationshipId].obj);
			} else if (unsavedRelationships[relationshipId].saveType == that.SAVE_STATE_UNSAVED_EDIT) {
				store.overwriteRelationship(unsavedRelationships[relationshipId].obj);
			} else if (unsavedRelationships[relationshipId].saveType == that.SAVE_STATE_UNSAVED_REMOVE) {
				store.removeRelationship(unsavedRelationships[relationshipId].obj);
			}
			
			savingRelationships[relationshipId] = unsavedRelationships[relationshipId];
			delete unsavedRelationships[relationshipId];
		}
		
		/* Remove nodes */
		for (var nodeId in unsavedNodes) {
			if (unsavedNodes[nodeId].saveType == that.SAVE_STATE_UNSAVED_REMOVE) {
				store.removeNode(unsavedNodes[nodeId].obj);
				savingNodes[nodeId] = unsavedNodes[nodeId];
				delete unsavedNodes[nodeId];
			}
		}
		
		/* Remove tags */
		for (var tagId in unsavedTags) {
			if (unsavedTags[tagId].saveType == that.SAVE_STATE_UNSAVED_REMOVE) {
				store.removeTag(unsavedTags[tagId].obj.tag);
				savingTags[tagId] = unsavedTags[tagId];
				delete unsavedTags[tagId];
			}
		}
		
		runLocalMessageHandlers(LocalStorageMessage.makeStartSave());
		store.store(saveHandle);
	}
	
	function saveHandle(storageMessages) {
		for (var i = 0; i < storageMessages.length; i++) {
			/* TODO: Add messages to a log */
			if (!storageMessages[i].failure) {
				/* Handle adding tag */
				if (storageMessages[i].messageType == StorageMessage.RESPOND_ADD_TAG) {
					that.selectTag(storageMessages[i].id);
				}
			} else {
				/* Keep track of failures in error maps (this is a bit sloppy... can be fixed up by
				 * getting rid of the currently unnecessary "tempIds" in messages, and making the contents
				 * of the messages more consistent) 
				 */
				if (storageMessages[i].messageType == StorageMessage.RESPOND_ADD_NODE) {
					errorNodes[storageMessages[i].tempId] = storageMessages[i];
				} else if (storageMessages[i].messageType == StorageMessage.RESPOND_ADD_RELATIONSHIP) {
					errorRelationships[buildRelationshipId(storageMessages[i].id1, storageMessages[i].id2)] = storageMessages[i];
				} else if (storageMessages[i].messageType == StorageMessage.RESPOND_ADD_TAG) {
					errorTags[storageMessages[i].tempId] = storageMessages[i];
				} else if (storageMessages[i].messageType == StorageMessage.RESPOND_OVERWRITE_NODE) {
					errorNodes[storageMessages[i].id] = storageMessages[i];
				} else if (storageMessages[i].messageType == StorageMessage.RESPOND_OVERWRITE_RELATIONSHIP) {
					errorRelationships[storageMessages[i].id] = storageMessages[i];
				} else if (storageMessages[i].messageType == StorageMessage.RESPOND_OVERWRITE_TAG) {
					errorTags[storageMessages[i].id] = storageMessages[i];
				} else if (storageMessages[i].messageType == StorageMessage.RESPOND_REMOVE_NODE) {
					errorNodes[storageMessages[i].id] = storageMessages[i];
				} else if (storageMessages[i].messageType == StorageMessage.RESPOND_REMOVE_RELATIONSHIP) {
					errorRelationships[storageMessages[i].id] = storageMessages[i];
				} else if (storageMessages[i].messageType == StorageMessage.RESPOND_REMOVE_TAG) {
					errorTags[storageMessages[i].id] = storageMessages[i];
				} else if (storageMessages[i].messageType == StorageMessage.RESPOND_GRANT_ACCESS_TAG) {
					//errorTags[storageMessages[i].id] = storageMessages[i]; FIXME: Can't do this now because not handling sharing with invalid users
				} else if (storageMessages[i].messageType == StorageMessage.RESPOND_REMOVE_ACCESS_TAG) {
					errorTags[storageMessages[i].id] = storageMessages[i];
				}
			}
		}
		
		savingNodes = {};
		savingRelationships = {};
		saveState = that.SAVE_STATE_NONE;
		
		if (retrievalState == that.RETRIEVAL_STATE_SKIPPED) {
			retrievalState = that.RETRIEVAL_STATE_NONE;
			retrieveGraph();
		}
		
		if (storageMessages.length > 0)
			runLocalMessageHandlers(LocalStorageMessage.makeFinishSave(storageMessages));
	}
	
	function unsaveStateTransition(unsavedMap, id, saveType, saveObj) {
		var prevSaveType = that.SAVE_STATE_UNSAVED_NONE;
		if (id in unsavedMap) {
			prevSaveType = unsavedMap[id].saveType;
		}
		
		if (prevSaveType == that.SAVE_STATE_UNSAVED_NONE) {
			// Transition from empty save state
			unsavedMap[id] = { obj : saveObj, saveType: saveType };
		} else if (prevSaveType == that.SAVE_STATE_UNSAVED_EDIT) {
			// Transition from edit save state
			if (saveType == that.SAVE_STATE_UNSAVED_EDIT || saveType == that.SAVE_STATE_UNSAVED_REMOVE) {
				unsavedMap[id].saveType = saveType;
				unsavedMap[id].obj = saveObj;
			} else {
				return false;
			}
		} else if (prevSaveType == that.SAVE_STATE_UNSAVED_ADD) {
			// Transition from add save state
			if (saveType == that.SAVE_STATE_UNSAVED_EDIT) {
				unsavedMap[id].saveType = that.SAVE_STATE_UNSAVED_ADD;
				unsavedMap[id].obj = saveObj;
			} else if (saveType == that.SAVE_STATE_UNSAVED_REMOVE) {
				delete unsavedMap[id];
			} else {
				return false;
			}
		} else if (prevSaveType == that.SAVE_STATE_UNSAVED_REMOVE) {
			// Transition from remove save state
			if (saveType == that.SAVE_STATE_UNSAVED_ADD) {
				unsavedMap[id].saveType = that.SAVE_STATE_UNSAVED_EDIT;
				unsavedMap[id].obj = saveObj;
			} else {
				return false;
			}
		} else {		
			// Invalid previous state
			return false;
		}
		
		return true;
	}
	
	function unsaveTag(saveType, id, saveObj) {
		if (saveObj.tag.creatorUserId != currentUser)
			return false;
			
		if (!unsaveStateTransition(unsavedTags, id, saveType, saveObj)) {
			if (id in unsavedTags)
				delete unsavedTags[id];
			
			return false;
		}
		
		return true;
	}
	
	function unsaveNode(saveType, node) {
		if (!node.writeAccess)
			return false;
			
		if (!unsaveStateTransition(unsavedNodes, node.id, saveType, node)) {
			if (node.id in unsavedNodes)
				delete unsavedNodes[node.id];
			return false;
		}
		
		return true;
	}
	
	function unsaveRelationship(saveType, relationship) {
		var node1 = selectedGraph.getNode(relationship.id1);
		var node2 = selectedGraph.getNode(relationship.id2);
	
		// Must have write-access to at least one incident node
		if (!node1.writeAccess && !node2.writeAccess)
			return false;
		
		// Relationship must already exist if editing/removing, but must not already exist if adding
		if (
		    !(saveType == that.SAVE_STATE_UNSAVED_ADD && !selectedGraph.hasRelationship(relationship.id1, relationship.id2)) 
		 && !(saveType != that.SAVE_STATE_UNSAVED_ADD && selectedGraph.hasRelationship(relationship.id1, relationship.id2))
		    ) {
			return false;
		}
	
		if (!unsaveStateTransition(unsavedRelationships, relationship.id, saveType, relationship)) {
			if (relationship.id in unsavedRelationships)
				delete unsavedRelationships[relationship.id];
			return false;
		}
		
		return true;
	}
	
	/* Graph modification stuff */
	
	this.addTag = function(id, name, immediateSave) {
		var tagMessage = StorageMessage.makeRequestAddTag(
		{
			id : id,
			name : name,
			creatorUserId : currentUser
		});
	
		if (!unsaveTag(that.SAVE_STATE_UNSAVED_ADD, id, tagMessage))
			return false;
	
		if (immediateSave)
			that.save();
	
		return true;
	}
	
	this.overwriteTag = function(id, name, visibility, immediateSave) {
		if (!selectedGraph.hasTag(id))
			return false;
		if (id in errorTags)
			return false;
			
		var tag = selectedGraph.getTag(id);
		
		if (!tag.writeAccess)
			return false;
	
		var tagMessage = StorageMessage.makeRequestOverwriteTag(tag);
		if (!unsaveTag(that.SAVE_STATE_UNSAVED_EDIT, id, tagMessage))
			return false;
			
		tag.name = name;
		tag.visibility = visibility;
		tag.updatedDate = Util.currentTime();
	
		if (immediateSave)
			that.save();
	
		return true;
	}
	
	this.removeTag = function(id, immediateSave) {
		if (!selectedGraph.hasTag(id))
			return false;
		if (id in errorTags)
			return false;
			
		var tag = selectedGraph.getTag(id);
		
		if (!tag.writeAccess || tag.nodeCount > 0)
			return false;
	
		var tagMessage = StorageMessage.makeRequestRemoveTag(tag);
		if (!unsaveTag(that.SAVE_STATE_UNSAVED_REMOVE, id, tagMessage))
			return false;
	
		selectedGraph.removeTag(id);
	
		if (immediateSave)
			that.save();
	
		return true;
	}
	
	this.grantAccessTag = function(id, userId, immediateSave) {
		if (!selectedGraph.hasTag(id))
			return false;
		if (id in errorTags)
			return false;
			
		var tag = selectedGraph.getTag(id);
		
		if (!tag.writeAccess)
			return false;
	
		var tagMessage = StorageMessage.makeRequestGrantAccessTag(tag, userId);
		if (!unsaveTag(that.SAVE_STATE_UNSAVED_EDIT, tag.id, tagMessage))
			return false;
	
		if (immediateSave)
			that.save();
	
		return true;
	}
	
	this.removeAccessTag = function(id, userId, immediateSave) {
		if (!selectedGraph.hasTag(id))
			return false;
		if (id in errorTags)
			return false;
			
		var tag = selectedGraph.getTag(id);
		
		if (!tag.writeAccess)
			return false;
	
		var tagMessage = StorageMessage.makeRequestRemoveAccessTag(tag, userId);
		if (!unsaveTag(that.SAVE_STATE_UNSAVED_EDIT, tag.id, tagMessage))
			return false;
	
		if (immediateSave)
			that.save();
	
		return true;
	}
	
	this.lockTag = function(id, lock) {
		if (!(id in selectedTags) || selectedTags[id].lock)
			return false;
		selectedTags[id].lock = lock;
		
		runLocalMessageHandlers(LocalStorageMessage.makeLockTag(id, lock));
		return true;
	}
	
	this.unlockTag = function(id, lock) {
		if (!(id in selectedTags) || selectedTags[id].lock != lock)
			return false;
			
		selectedTags[id].lock = undefined;
		runLocalMessageHandlers(LocalStorageMessage.makeUnlockTag(id, lock));
		return true;
	}
	
	this.addNode = function(brief, thorough, main, immediateSave) {
		if (!mainSelectedTagId)
			return undefined;
			
		var mainSelectedTag = selectedGraph.getTag(mainSelectedTagId);
		
		var node = 
		{
			id : mainSelectedTagId + "_" + mainSelectedTag.nodeIdIterator,
			tagId : mainSelectedTagId,
			brief : brief,
			thorough : thorough,
			posX : 0,
			posY : 0,
			main : main,
			readAccess : true,
			writeAccess : true,
			updatedDate : Util.currentTime(),
			deleted : false			
		}
		
		if (!selectedGraph.addNode(node))
			return undefined;
		
		if (!unsaveNode(that.SAVE_STATE_UNSAVED_ADD, node)) {
			selectedGraph.removeNode(node.id);
			return undefined;
		}
		
		mainSelectedTag.nodeCount++;
		mainSelectedTag.nodeIdIterator++;

		if (immediateSave)
			that.save();
		
		return node.id;
	}
	
	this.overwriteNode = function(id, brief, thorough, main, immediateSave) {
		if (!selectedGraph.hasNode(id))
			return false;
		if (id in errorNodes)
			return false;
		
		var node = selectedGraph.getNode(id);
		
		if (!node.writeAccess)
			return false;
		
		if (!unsaveNode(that.SAVE_STATE_UNSAVED_EDIT, node))
			return false;
			
		node.brief = brief;
		node.thorough = thorough;
		node.main = main;
		
		if (immediateSave)
			that.save();
		
		return true;
	}
	
	this.removeNode = function(id, immediateSave) {
		if (!selectedGraph.hasNode(id))
			return false;
		if (id in errorNodes)
			return false;
		
		var node = selectedGraph.getNode(id);
		
		if (!node.writeAccess)
			return false;
		
		if (!unsaveNode(that.SAVE_STATE_UNSAVED_REMOVE, node))
			return false;
		
		selectedGraph.getTag(node.tagId).nodeCount--;
		selectedGraph.removeNode(id);
		
		if (immediateSave)
			that.save();
		
		return true;
	}
	
	this.addRelationship = function(id1, id2, type, group, direction, thorough, immediateSave) {
		if (!selectedGraph.hasNode(id1) 
			|| !selectedGraph.hasNode(id2)
			|| (!selectedGraph.getNode(id1).writeAccess && !selectedGraph.getNode(id2).writeAccess))
			return undefined;

		var id = buildRelationshipId(id1, id2);
		if (selectedGraph.hasRelationship(id1, id2)) // || id in errorRelationships) FIXME: Add this back in after fix relationship race-condition bug
			return undefined;
		
		var relationship = {
			id : id,
			id1 : id1,
			id2 : id2,
			type : type,
			group : group,
			direction : direction,
			thorough : thorough,
			readAccess : true,
			writeAccess : true,
			updatedDate : Util.currentTime(),
			deleted : false
		};
		
		if (!unsaveRelationship(that.SAVE_STATE_UNSAVED_ADD, relationship))
			return undefined;
		
		selectedGraph.setRelationship(relationship);
		
		if (immediateSave)
			that.save();
		
		return id;
	}
	
	this.overwriteRelationship = function(id1, id2, type, group, direction, thorough, immediateSave) {
		if (!selectedGraph.hasRelationship(id1, id2)) // || id in errorRelationships) FIXME: Add this back in after fix relationship race-condition bug
			return false;
			
		var relationship = selectedGraph.getRelationship(id1, id2);
		if (!relationship.writeAccess)
			return false;
		
		if (!unsaveRelationship(that.SAVE_STATE_UNSAVED_EDIT, relationship))
			return false;
		
		relationship.type = type;
		relationship.group = group;
		relationship.direction = direction;		
		relationship.thorough = thorough;
		relationship.updatedDate = Util.currentTime();
		
		if (immediateSave)
			that.save();
		
		return true;
	}
	
	this.removeRelationship = function(id1, id2, immediateSave) {
		if (!selectedGraph.hasRelationship(id1, id2)) // || id in errorRelationships) FIXME: Add this back in after fix relationship race-condition bug
			return false;
			
		var relationship = selectedGraph.getRelationship(id1, id2);
		if (!relationship.writeAccess)
			return false;
		
		if (!unsaveRelationship(that.SAVE_STATE_UNSAVED_REMOVE, relationship))
			return false;
		
		selectedGraph.removeRelationship(id1, id2);
		
		if (immediateSave)
			that.save();
		
		return true;
	}
}
