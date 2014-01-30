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
function MessViewControl(canvas, overlayCanvas, currentUser, messStore) {
	var that = this;  
	
	var visualGraph = new VisualGraph(canvas, overlayCanvas);
	var messHistory = new MessHistory(that);
	var messStore = messStore;
	
	/* Number of different colors for edges and types of edges */
	this.NUM_EDGE_GROUPS = 200;
	this.NUM_EDGE_TYPES = 3;

	/* Different types of edges */
	this.EDGE_TYPE_EVIDENCE = VisualEdge.EDGE_TYPE_NORMAL;
	this.EDGE_TYPE_QUESTION = VisualEdge.EDGE_TYPE_SQUIGGLE;
	this.EDGE_TYPE_INCONSISTENT = VisualEdge.EDGE_TYPE_X;
	
	/* Vertex stuff */
	this.MAIN_VERT_COLOR = "#000000";
	this.TAG_VERT_COLOR = "#000000";
	this.TAG_VERT_RADIUS = 7;
	
	var currentEdgeType = this.EDGE_TYPE_EVIDENCE;
	var currentEdgeGroup = 0;
	var edgeColors = [];
	for (var i = 0; i < this.NUM_EDGE_GROUPS; i++) {
		edgeColors.push(RandomColors.next());
	}
	
	var updateStatusFn = undefined;
	var updateContentFn = undefined;
	var updateEditContentFn = undefined;
	
	var editingFocus = false;
	var editFocusPosX = 0;
	var editFocusPosY = 0;
	var getEditThoroughFn = undefined;
	var getEditBriefFn = undefined;
	var getEditFocusPosXFn = undefined;
	var getEditFocusPosYFn = undefined;
	
	// Node id maps
	var nVisualToStoreIds = {};
	var nStoreToVisualIds = {};
	
	// Tag id maps (unselected)
	var tVisualToStoreIds = {};
	var tStoreToVisualIds = {};
	
	messStore.addLocalMessageHandler(storeMessageHandler);
	visualGraph.animate();
	
	/* Miscellaneous Getters */
	
	this.getUnsavedVerts = function() {
		var nodes = messStore.getUnsavedNodes();
		var verts = [];
		for (var i = 0; i < nodes.length; i++) {
			verts.push(nStoreToVisualIds[nodes[i]]);
		}
		return verts;
	}

	this.getUnsavedEdges = function() {
		var relationships = messStore.getUnsavedRelationships();
		var edges = [];
		for (var i = 0; i < relationships.length; i++) {
			edges.push({ 
				id1: nStoreToVisualIds[relationships[i].id1], 
				id2: nStoreToVisualIds[relationships[i].id2] 
			});
		}
		return edges;
	}
	
	this.getSavingVerts = function() {
		var nodes = messStore.getSavingNodes();
		var verts = [];
		for (var i = 0; i < nodes.length; i++) {
			verts.push(nStoreToVisualIds[nodes[i]]);
		}
		return verts;
	}
	
	this.getSavingEdges = function() {
		var relationships = messStore.getSavingRelationships();
		var edges = [];
		for (var i = 0; i < relationships.length; i++) {
			edges.push({ 
				id1: nStoreToVisualIds[relationships[i].id1], 
				id2: nStoreToVisualIds[relationships[i].id2] 
			});
		}
		return edges;
	}
	
	this.getErrorVerts = function() {
		var nodes = messStore.getErrorNodes();
		var verts = [];
		for (var i = 0; i < nodes.length; i++) {
			verts.push(nStoreToVisualIds[nodes[i]]);
		}
		return verts;
	}
	
	this.getErrorEdges = function() {
		var relationships = messStore.getErrorRelationships();
		var edges = [];
		for (var i = 0; i < relationships.length; i++) {
			edges.push({ 
				id1: nStoreToVisualIds[relationships[i].id1], 
				id2: nStoreToVisualIds[relationships[i].id2] 
			});
		}
		return edges;
	}
	
	this.getVisual = function() {
		return visualGraph;
	}
	
	/* Updates to external interface */
	
	this.setUpdateFunctions = function(statusFn, contentFn, editContentFn) {
		updateStatusFn = statusFn;
		updateContentFn = contentFn;
		updateEditContentFn = editContentFn;
	}
	
	/* Focus and edit */
	
	this.setEditContentFunctions = function(briefFn, thoroughFn, posXFn, posYFn) {	
		getEditBriefFn = briefFn;
		getEditThoroughFn = thoroughFn;
		getEditFocusPosXFn = posXFn;
		getEditFocusPosYFn = posYFn;
	}
	
	this.isEditingFocus = function() {
		return editingFocus;
	}
	
	this.getFocusContentThorough = function() {
		if (visualGraph.getFocusVertexId() && (visualGraph.getFocusVertexId() in nVisualToStoreIds))
			return messStore.getNode(nVisualToStoreIds[visualGraph.getFocusVertexId()]).thorough;
		else if (visualGraph.getFocusEdgeId1() && visualGraph.getFocusEdgeId2())
			return messStore.getRelationship(nVisualToStoreIds[visualGraph.getFocusEdgeId1()], nVisualToStoreIds[visualGraph.getFocusEdgeId2()]).thorough;
		else
			return undefined;
	}
	
	this.getFocusColor = function() {
		if (visualGraph.getFocusVertexId()) {
			var node = messStore.getNode(nVisualToStoreIds[visualGraph.getFocusVertexId()]);
			return messStore.getTag(node.tagId).color;
		} else if (visualGraph.getFocusEdgeId1()) {
			var node = messStore.getNode(nVisualToStoreIds[visualGraph.getFocusEdgeId1()]);
			return messStore.getTag(node.tagId).color;
		} else {
			return undefined;
		}
	}
	
	this.getEditFocusContentThorough = function() {
		if (visualGraph.getFocusVertexId() && (visualGraph.getFocusVertexId() in nVisualToStoreIds) && editingFocus) {
			return messStore.getNode(nVisualToStoreIds[visualGraph.getFocusVertexId()]).thorough;
		} else if (visualGraph.getFocusEdgeId1() && editingFocus) {
			return messStore.getRelationship(nVisualToStoreIds[visualGraph.getFocusEdgeId1()], nVisualToStoreIds[visualGraph.getFocusEdgeId2()]).thorough;
		} else
			return undefined
	}
	
	this.getEditFocusContentBrief = function() {
		if (visualGraph.getFocusVertexId() && (visualGraph.getFocusVertexId() in nVisualToStoreIds) && editingFocus)
			return messStore.getNode(nVisualToStoreIds[visualGraph.getFocusVertexId()]).brief;
		else
			return undefined
	}
	
	this.setFocusVertex = function(id) {
		if (!id)
			that.finishEditFocus();
	
		visualGraph.setFocusVertex(id);
	}
	
	this.setFocusPoint = function(posX, posY, allowFocusVertexChange) {
		if (editingFocus)
			return;
		
		visualGraph.setFocusPoint(posX, posY, allowFocusVertexChange);
			
		updateContentFn();
	}
	
	this.selectFocusPoint = function(posX, posY) {
		if (editingFocus)
			return;
		
		this.setFocusPoint(posX, posY, true);
		visualGraph.selectFocusPoint();
	}
	
	this.deselectFocusPoint = function(posX, posY, toggleSelect) {
		if (editingFocus) {
			that.finishEditFocus();
			return;
		}
	
		that.setFocusPoint(posX, posY, true);
		visualGraph.deselectFocusPoint(toggleSelect);
	}
	
	this.enterFocusPoint = function(posX, posY) {
		if (editingFocus)
			return;
		
		visualGraph.setFocusPoint(posX, posY, true);
			
		if (!visualGraph.getFocusVertexId())
			return;
		if (visualGraph.getFocusVertexId() in tVisualToStoreIds)
			messStore.selectTag(tVisualToStoreIds[visualGraph.getFocusVertexId()]);
		else
			messStore.deselectTag(messStore.getNode(nVisualToStoreIds[visualGraph.getFocusVertexId()]).tagId);
	}

	this.editFocus = function() {
		if (!visualGraph.hasFocusObject() 
		|| (visualGraph.getFocusVertexId() && (visualGraph.getFocusVertexId() in nVisualToStoreIds) &&
				!messStore.getNode(nVisualToStoreIds[visualGraph.getFocusVertexId()]).writeAccess)
		|| (visualGraph.getFocusEdgeId1() && 
				!messStore.getRelationship(nVisualToStoreIds[visualGraph.getFocusEdgeId1()], nVisualToStoreIds[visualGraph.getFocusEdgeId2()]).writeAccess))
			return;	
		
		if (editingFocus) {
			that.finishEditFocus();
			return;
		}

		editingFocus = true;
		if (visualGraph.getFocusVertexId()) {
			visualGraph.setVertLabelVisible(visualGraph.getFocusVertexId(), false);
			visualGraph.setWindowScrollFocusVert(visualGraph.getFocusVertexId(), getEditFocusPosXFn(), getEditFocusPosYFn());
			updateEditContentFn();
		} else if (visualGraph.getFocusEdgeId1()) {
			visualGraph.setWindowScrollFocusEdge(visualGraph.getFocusEdgeId1(), visualGraph.getFocusEdgeId2(), getEditFocusPosXFn(), getEditFocusPosYFn());
			updateEditContentFn(true);
		}
		
		updateContentFn();
	}
	
	this.finishEditFocus = function() {
		if (!editingFocus
		|| !visualGraph.hasFocusObject() 
		|| (visualGraph.getFocusVertexId() && (visualGraph.getFocusVertexId() in nVisualToStoreIds) &&
			!messStore.getNode(nVisualToStoreIds[visualGraph.getFocusVertexId()]).writeAccess)
		|| (visualGraph.getFocusEdgeId1() && 
				!messStore.getRelationship(nVisualToStoreIds[visualGraph.getFocusEdgeId1()], nVisualToStoreIds[visualGraph.getFocusEdgeId2()]).writeAccess))
			return;
			
		var thorough = filterVertexContent(getEditThoroughFn(), true);
		editingFocus = false;
		
		if (visualGraph.getFocusVertexId()) {
			var brief = filterVertexContent(getEditBriefFn(), false);
			visualGraph.setVertLabelVisible(visualGraph.getFocusVertexId(), true);
			visualGraph.setWindowScrollFocusVert(undefined);
			that.overwriteVert(visualGraph.getFocusVertexId(), brief, thorough, messStore.getNode(nVisualToStoreIds[visualGraph.getFocusVertexId()]).main, false);
		} else if (visualGraph.getFocusEdgeId1()) {
			var r = messStore.getRelationship(nVisualToStoreIds[visualGraph.getFocusEdgeId1()], nVisualToStoreIds[visualGraph.getFocusEdgeId2()]);
			visualGraph.setWindowScrollFocusEdge(undefined);
			that.overwriteEdge(visualGraph.getFocusEdgeId1(), visualGraph.getFocusEdgeId2(), r.type, r.group, r.direction, thorough, false);
		}
		
		updateContentFn();
		updateEditContentFn();
		
		messStore.save();
	}
	
	/* Filtering */
	
	function filterVertexContent(content, allowMultipleLines) {
		/* FIXME : Improve this later */
		if (!allowMultipleLines) {
			content = content.replace(/<br\s*\/?>/mg, "\n");
			content = content.replace(/<\/?div>/mg, "\n");
			content = content.replace(/\\n/g, " ");
		}
		
		content = content.replace(/&nbsp;/g, " ");
		content = content.replace(/&/g, " ");
		
		return content;
	}
	
	/* Scrolling and window stuff */
	
	this.setFullVisibleWindow = function(top, left, height, width) {
		visualGraph.setFullVisibleWindow(top, left, height, width);
	}
	
	this.setMovementUpOn = function() {
		visualGraph.scrollUpOn();
	}
	
	this.setMovementUpOff = function() {
		visualGraph.scrollUpOff();
	}
	
	this.setMovementDownOn = function() {
		visualGraph.scrollDownOn();
	}
	
	this.setMovementDownOff = function() {
		visualGraph.scrollDownOff();
	}
	
	this.setMovementLeftOn = function() {
		visualGraph.scrollLeftOn();
	}
	
	this.setMovementLeftOff = function() {
		visualGraph.scrollLeftOff();
	}
	
	this.setMovementRightOn = function() {
		visualGraph.scrollRightOn();
	}
	
	this.setMovementRightOff = function() {
		visualGraph.scrollRightOff();
	}
	
	/* Vertex selection and highlighting */
	
	this.selectVerts = function() {
		var highlightedVerts = visualGraph.getHighlightedVerts();
		for (var i = 0; i < highlightedVerts.length; i++) {
			visualGraph.selectVert(highlightedVerts[i]);
		}
		visualGraph.resetHighlightedPrefix();
	}
	
	this.deselectVerts = function() {
		visualGraph.selectVert(undefined);
	}
	
	this.appendHighlight0 = function() {
		visualGraph.appendHighlightedPrefix('0');
	}
	
	this.appendHighlight1 = function() {
		visualGraph.appendHighlightedPrefix('1');
	}

	this.appendHighlight2 = function() {
		visualGraph.appendHighlightedPrefix('2');
	}
	
	this.appendHighlight3 = function() {
		visualGraph.appendHighlightedPrefix('3');
	}
	
	this.appendHighlight4 = function() {
		visualGraph.appendHighlightedPrefix('4');
	}
	
	this.appendHighlight5 = function() {
		visualGraph.appendHighlightedPrefix('5');
	}
	
	this.appendHighlight6 = function() {
		visualGraph.appendHighlightedPrefix('6');
	}
	
	this.appendHighlight7 = function() {
		visualGraph.appendHighlightedPrefix('7');
	}
	
	this.appendHighlight8 = function() {
		visualGraph.appendHighlightedPrefix('8');
	}
	
	this.appendHighlight9 = function() {
		visualGraph.appendHighlightedPrefix('9');
	}
	
	this.appendHighlightDot = function() {
		visualGraph.appendHighlightedPrefix('.');
	}
	
	this.shrinkHighlight = function() {
		visualGraph.shrinkHighlightedPrefix();
	}
	
	/* Local (non-storage) mutators */
	
	function updateLocalTag(storeId, label) {
		if ((!messStore.getTag(storeId) && storeId in tStoreToVisualIds)
			|| (messStore.tagSelected(storeId) && storeId in tStoreToVisualIds)) {
			/* Remove visual for tag when it's selected (verts replace it) */
			var visualId = tStoreToVisualIds[storeId];
			visualGraph.removeVerts([visualId]);
			delete tStoreToVisualIds[storeId];
			delete tVisualToStoreIds[visualId];
		} else if (messStore.getTag(storeId) && !messStore.tagSelected(storeId)) {
			if (storeId in tStoreToVisualIds) {
				var visualId = tStoreToVisualIds[storeId];
				if (label)
					visualGraph.setVertLabel(visualId, label);
			} else {
				/* Add visual */
				var visualId = visualGraph.addVert((label) ? label : '', [that.TAG_VERT_COLOR]);
				visualGraph.setVertRadius(visualId, that.TAG_VERT_RADIUS);
				tStoreToVisualIds[storeId] = visualId;
				tVisualToStoreIds[visualId] = storeId;
			}
			updateLocalTagRelationships(storeId);
		} 
	}
	
	function updateLocalTagRelationships(storeId) {
		var visualId = tStoreToVisualIds[storeId];
		var relatedNodes = messStore.getTagRelatedNodeIds(storeId, true);
		for (var nodeStoreId in relatedNodes) {
			if (!(nodeStoreId in nStoreToVisualIds))
				continue; // HACK: If node hasn't been added in yet
			
			var nVisualId = nStoreToVisualIds[nodeStoreId];
			if (!visualGraph.hasEdge(visualId, nVisualId)) {
				visualGraph.addEdge(visualId, nVisualId, that.TAG_VERT_COLOR, VisualEdge.EDGE_DIR_BOTH, VisualEdge.EDGE_TYPE_NORMAL);
				visualGraph.setEdgeFocusable(visualId, nVisualId, false);
			}
		}
	}
	
	function updateLocalVert(storeId, brief, main) {
		var visualId = undefined;
		if (storeId in nStoreToVisualIds) {
			visualId = nStoreToVisualIds[storeId];
			if (main) {
				visualGraph.colorVert(visualId, [that.MAIN_VERT_COLOR, messStore.getTagColor(messStore.getNode(storeId).tagId)]);
			} else {
				visualGraph.colorVert(visualId, [messStore.getTagColor(messStore.getNode(storeId).tagId)]);
			}
			visualGraph.setVertLabel(visualId, brief);
		} else {
			if (main) {
				visualId = visualGraph.addVert(brief, [that.MAIN_VERT_COLOR, messStore.getTagColor(messStore.getNode(storeId).tagId)]);
				that.setFocusVertex(visualId);
			} else {
				visualId = visualGraph.addVert(brief, [messStore.getTagColor(messStore.getNode(storeId).tagId)]);
			}
		
			nStoreToVisualIds[storeId] = visualId;
			nVisualToStoreIds[visualId] = storeId;
		}
		
		return visualId;
	}
	
	function removeLocalVert(storeId, keepStoreToVisualId) {
		if (!(storeId in nStoreToVisualIds))
			return;
		
		var visualId = nStoreToVisualIds[storeId];
		
		if (visualGraph.getFocusVertexId() == visualId) {
			that.setFocusVertex(undefined);
		}		

		if (!keepStoreToVisualId)
			delete nStoreToVisualIds[storeId];
		delete nVisualToStoreIds[visualId];
		visualGraph.removeVerts([visualId]);
	}
	
	function updateLocalEdge(storeId1, storeId2, type, group, direction, thorough) {
		if (!(storeId1 in nStoreToVisualIds) || !(storeId2 in nStoreToVisualIds))
			return;
			
		var visualId1 = nStoreToVisualIds[storeId1];
		var visualId2 = nStoreToVisualIds[storeId2];
			
		if (!visualGraph.hasEdge(visualId1, visualId2))
			visualGraph.addEdge(visualId1, visualId2, edgeColors[group], direction, type);
		else
			visualGraph.editEdge(visualId1, visualId2, edgeColors[group], direction, type);
	}
	
	function removeLocalEdge(storeId1, storeId2) {
		if (!(storeId1 in nStoreToVisualIds) || !(storeId2 in nStoreToVisualIds))
			return;
			
		var visualId1 = nStoreToVisualIds[storeId1];
		var visualId2 = nStoreToVisualIds[storeId2];
		
		if (visualGraph.hasEdge(visualId1, visualId2))
			visualGraph.removeEdge(visualId1, visualId2);
	}
	
	/* Storage message handling */
	
	function storeMessageHandler(message) {
		if (message.messageType == LocalStorageMessage.SELECT_TAG) {
			updateLocalTag(message.id, "Loading...");
		} else if (message.messageType == LocalStorageMessage.DESELECT_TAG) {
			for (var i = 0; i < message.nodeIds.length; i++)
				removeLocalVert(message.nodeIds[i]);
			for (var relatedTagId in message.relatedUnselectedTagIds)
				updateLocalTag(relatedTagId);
			updateLocalTag(message.id, (messStore.getTag(message.id) ? messStore.getTag(message.id).name + " (Collapsed)" : ""));
		} else if (message.messageType == LocalStorageMessage.SKIP_RETRIEVAL) {
			updateStatusFn();
		} else if (message.messageType == LocalStorageMessage.NO_START_RETRIEVAL) {
			updateStatusFn(); 
		} else if (message.messageType == LocalStorageMessage.START_RETRIEVAL) {
			updateStatusFn();
		} else if (message.messageType == LocalStorageMessage.FINISH_RETRIEVAL) {
			updateStatusFn();
		} else if (message.messageType == LocalStorageMessage.RETRIEVE_ADD_TAG) {
			updateLocalTag(message.tag.id, messStore.getTag(message.tag.id).name + " (Collapsed)");
		} else if (message.messageType == LocalStorageMessage.RETRIEVE_ADD_NODE) {
			if (!messStore.tagSelected(message.node.tagId))
				return;
			else if (message.node.deleted)
				removeLocalVert(message.node.id);
			else
				updateLocalVert(message.node.id, message.node.brief, message.node.main);
		} else if (message.messageType == LocalStorageMessage.RETRIEVE_ADD_RELATIONSHIP) {
			if (message.relationship.deleted)
				removeLocalEdge(message.relationship.id1, message.relationship.id2);
			else if (!messStore.getNode(message.relationship.id1) 
				  || !messStore.getNode(message.relationship.id2) 
				  || !messStore.tagSelected(messStore.getNode(message.relationship.id1).tagId) 
				  || !messStore.tagSelected(messStore.getNode(message.relationship.id2).tagId))
				return;
			else
				updateLocalEdge(message.relationship.id1, message.relationship.id2, message.relationship.type, message.relationship.group, message.relationship.direction, message.relationship.thorough);
		} else if (message.messageType == LocalStorageMessage.RETRIEVE_ADD_META_DATA) {
			// Nothing
		} else if (message.messageType == LocalStorageMessage.REINIITIALIZE_TAG) {
			for (var i = 0; i < message.nodeIds.length; i++)
				removeLocalVert(message.nodeIds[i]);
		} else if (message.messageType == LocalStorageMessage.START_SAVE) {
			updateStatusFn();
		} else if (message.messageType == LocalStorageMessage.SKIP_SAVE) {
			updateStatusFn();
		} else if (message.messageType == LocalStorageMessage.FINISH_SAVE) {
			for (var i = 0; i < message.storageMessages.length; i++) {
				if (message.storageMessages[i].messageType == StorageMessage.RESPOND_REMOVE_NODE) {
					delete nStoreToVisualIds[message.storageMessages[i].id];
				}
			}
			updateStatusFn();
		} else if (message.messageType == LocalStorageMessage.FINISH_RETRIEVAL_ADDITION) {
			for (var tStoreId in tStoreToVisualIds) {
				updateLocalTagRelationships(tStoreId);
			}
		}
	}

	/* Graph modification stuff */
	
	this.undo = function() {
		messHistory.undo();
	}
	
	this.addVert = function(brief, thorough, main) {
		// Note: typeof is quick fix for key event passed in by keyboard handling library
		if (!brief || typeof(brief) != 'string') 
			brief = '';
		if (!thorough)
			thorough = '';
		if (!main)
			main = false;
	
		var storeId = messStore.addNode(brief, thorough, main, false);
		if (!storeId)
			return undefined;
		
		var localId = updateLocalVert(storeId, brief, main);
		
		messHistory.addVert(localId);
		that.setFocusVertex(localId);
		
		messStore.save();
		
		return localId;
	}
	
	this.overwriteVert = function(localId, brief, thorough, main, immediateSave) {
		if (!(localId in nVisualToStoreIds))
			return false;
			
		var storeId = nVisualToStoreIds[localId];
		
		messHistory.overwriteVert(localId, messStore.getNode(storeId));
		
		if (!messStore.overwriteNode(storeId, brief, thorough, main, immediateSave)) {
			messHistory.backtrack();
			return false;
		}
		
		updateLocalVert(storeId, brief, main);
		that.setFocusVertex(localId);
		
		return true;
	}
	
	this.removeVert = function(localId, immediateSave) {
		if (!(localId in nVisualToStoreIds))
			return false;
			
		var storeId = nVisualToStoreIds[localId];
	
		messHistory.removeVert(localId, messStore.getNode(storeId));
	
		if (!messStore.removeNode(storeId, immediateSave)) {
			messHistory.backtrack();
			return false;
		}
	
		removeLocalVert(storeId, true);
		
		return true;
	}
	
	this.removeVerts = function() {
		var selectedVerts = visualGraph.getSelectedVerts();
		
		if (selectedVerts.length == 0)
			return;
			
		while (selectedVerts.length > 0) {
			that.removeVert(selectedVerts[0], false);
		}
		
		messStore.save();
	}
	
	this.toggleMainVerts = function() {
		var selectedVerts = visualGraph.getSelectedVerts();
		
		if (selectedVerts.length == 0)
			return;
	
		for (var i = 0; i < selectedVerts.length; i++) {
			var node = messStore.getNode(nVisualToStoreIds[selectedVerts[i]]);
			that.overwriteVert(selectedVerts[i], node.brief, node.thorough, !node.main, false);
		}
		
		messStore.save();
	}
	
	this.addEdge = function(localId1, localId2, type, group, direction, thorough, immediateSave) {
		if (!(localId1 in nVisualToStoreIds) 
		 || !(localId2 in nVisualToStoreIds)
		 || visualGraph.hasEdge(localId1, localId2))
			return false;
		
		var storeId1 = nVisualToStoreIds[localId1];
		var storeId2 = nVisualToStoreIds[localId2];
		
		if (!messStore.addRelationship(storeId1, storeId2, type, group, direction, thorough, immediateSave))
			return false;
		
		messHistory.addEdge(localId1, localId2);
		updateLocalEdge(storeId1, storeId2, type, group, direction, thorough); 
		
		return true;
	}

	this.overwriteEdge = function(localId1, localId2, type, group, direction, thorough, immediateSave) {
		if (!(localId1 in nVisualToStoreIds) 
		 || !(localId2 in nVisualToStoreIds)
		 || !visualGraph.hasEdge(localId1, localId2))
			return false;
	
		var storeId1 = nVisualToStoreIds[localId1];
		var storeId2 = nVisualToStoreIds[localId2];
			
		messHistory.overwriteEdge(localId1, localId2, messStore.getRelationship(storeId1, storeId2));
		
		if (!messStore.overwriteRelationship(storeId1, storeId2, type, group, direction, thorough, immediateSave)) {
			messHistory.backtrack();
			return false;
		}
		
		updateLocalEdge(storeId1, storeId2, type, group, direction, thorough); 
		
		return true;
	}
	
	this.removeEdge = function(localId1, localId2, immediateSave) {
		if (!(localId1 in nVisualToStoreIds) 
		 || !(localId2 in nVisualToStoreIds)
		 || !visualGraph.hasEdge(localId1, localId2))
			return false;
	
		var storeId1 = nVisualToStoreIds[localId1];
		var storeId2 = nVisualToStoreIds[localId2];
		
		var relationship = messStore.getRelationship(storeId1, storeId2);
		if (!relationship)
			return false;
		
		if (!messStore.removeRelationship(storeId1, storeId2, immediateSave)) {
			return false;
		}
		
		messHistory.removeEdge(localId1, localId2, relationship);
		removeLocalEdge(storeId1, storeId2); 
		
		return true;
	}
	
	this.addEdges = function() {
		var localIdPairs = visualGraph.getSelectedVertPairs();
		if (localIdPairs.length == 0)
			return;
		
		for (var i = 0; i < localIdPairs.length; i++) {
			that.addEdge(localIdPairs[i].id1, localIdPairs[i].id2, currentEdgeGroup, VisualEdge.EDGE_DIR_FORWARD, "", false);
		}
		
		messStore.save();
	}
	
	this.removeEdges = function() {
		var localIdPairs = visualGraph.getSelectedVertPairs();
		if (localIdPairs.length == 0)
			return;
		
		for (var i = 0; i < localIdPairs.length; i++) {
			that.removeEdge(localIdPairs[i].id1, localIdPairs[i].id2, false);
		}
		
		messStore.save();
	}
	
	
	this.directionEdges = function() {
		var localIdPairs = visualGraph.getSelectedVertPairs();
		if (localIdPairs.length == 0)
			return;
		
		for (var i = 0; i < localIdPairs.length; i++) {
			var storeId1 = nVisualToStoreIds[localIdPairs[i].id1];
			var storeId2 = nVisualToStoreIds[localIdPairs[i].id2];
			
			var relationship = messStore.getRelationship(storeId1, storeId2);
			var direction = relationship.direction;
			if (relationship.direction == VisualEdge.EDGE_DIR_FORWARD) {
				direction = VisualEdge.EDGE_DIR_BACKWARD;
			} else if (relationship.direction == VisualEdge.EDGE_DIR_BACKWARD) {
				direction = VisualEdge.EDGE_DIR_FORWARD;
			}
		
			that.overwriteEdge(localIdPairs[i].id1, localIdPairs[i].id2, relationship.type, relationship.group, direction, relationship.thorough, false);
		}
		
		messStore.save();
	}
	
	this.typeEdges = function() {
		var localIdPairs = visualGraph.getSelectedVertPairs();
		if (localIdPairs.length == 0)
			return;
		
		currentEdgeType = (currentEdgeType + 1) % that.NUM_EDGE_TYPES;
		
		for (var i = 0; i < localIdPairs.length; i++) {
			var storeId1 = nVisualToStoreIds[localIdPairs[i].id1];
			var storeId2 = nVisualToStoreIds[localIdPairs[i].id2];
			
			var relationship = messStore.getRelationship(storeId1, storeId2);
			var direction = relationship.direction;
			var type = relationship.type;
			
			if (currentEdgeType == that.EDGE_TYPE_EVIDENCE) {
				type = that.EDGE_TYPE_EVIDENCE;
				if (relationship.direction == VisualEdge.EDGE_DIR_BOTH)
					direction = VisualEdge.EDGE_DIR_FORWARD;							
			} else if (currentEdgeType == that.EDGE_TYPE_QUESTION) {
				type = that.EDGE_TYPE_QUESTION;
				if (relationship.direction == VisualEdge.EDGE_DIR_BOTH)
					direction = VisualEdge.EDGE_DIR_FORWARD;	
			} else if (currentEdgeType == that.EDGE_TYPE_INCONSISTENT) {
				type = that.EDGE_TYPE_INCONSISTENT;
				direction = VisualEdge.EDGE_DIR_BOTH;
			}
			
			that.overwriteEdge(localIdPairs[i].id1, localIdPairs[i].id2, type, relationship.group, direction, relationship.thorough, false);
		}
		
		messStore.save();
	}
	
	this.groupEdges = function() {
		var localIdPairs = visualGraph.getSelectedVertPairs();
		if (localIdPairs.length == 0)
			return;
		
		currentEdgeGroup = (currentEdgeGroup + 1) % that.NUM_EDGE_GROUPS;
		
		for (var i = 0; i < localIdPairs.length; i++) {
			var storeId1 = nVisualToStoreIds[localIdPairs[i].id1];
			var storeId2 = nVisualToStoreIds[localIdPairs[i].id2];
			
			var relationship = messStore.getRelationship(storeId1, storeId2);
			var group = currentEdgeGroup;
			
			that.overwriteEdge(localIdPairs[i].id1, localIdPairs[i].id2, relationship.type, group, relationship.direction, relationship.thorough, false);
		}
		
		messStore.save();
	}
	
	/* To and from strings (export and import) [FIXME: Move these functions to their own objects] */
	
	this.toArgumentString = function() {
		/* FIXME: Output breadth-first from sinks (if there are sinks) */
		var graphStr = '';
		for (var visualId in nVisualToStoreIds) {
			var storeId = nVisualToStoreIds[visualId];
			var node = messStore.getNode(storeId);

			graphStr += '<div class="claim">[' + visualId + '] ' + ((node.brief.length != 0) ? node.brief : '(No Content)') + '</div>';
			if (node.thorough.length > 0)
				graphStr += '<div class="thorough">(' + node.thorough + ')</div>';
			
			/* Gather vertices that are related to the current vertex in various ways */
			var inconsistent = {};
			var questions = {};
			var evidence = {};
			var relCount = 0;
			var nodeRels = messStore.getNodeRelationships(storeId);
			
			for (var nId in nodeRels) { /* FIXME */
				var relationship = nodeRels[nId];
				if ((relationship.direction == VisualEdge.EDGE_DIR_BOTH) || 
					(relationship.direction == VisualEdge.EDGE_DIR_FORWARD && node.id == relationship.id2) ||
					(relationship.direction == VisualEdge.EDGE_DIR_BACKWARD && node.id == relationship.id1)) {
					if (relationship.type == that.EDGE_TYPE_EVIDENCE) {
						if (!(relationship.group in evidence))
							evidence[relationship.group] = [];
						evidence[relationship.group].push(nId);
					} else if (relationship.type == that.EDGE_TYPE_INCONSISTENT) {
						if (!(relationship.group in inconsistent))
							inconsistent[relationship.group] = [];
						inconsistent[relationship.group].push(nId);					
					} else if (relationship.type == that.EDGE_TYPE_QUESTION) {
						if (!(relationship.group in questions))
							questions[relationship.group] = [];
						questions[relationship.group].push(nId);
					}
					relCount++;
				}
			}
			
			/* Output neighbors of various types */
			for (var group in evidence) {
				graphStr += '<div class="argumentHeading">Argument:</div>';
				graphStr += '<div class="argument">';
				for (var i = 0; i < evidence[group].length; i++) {
					var evidenceNode = messStore.getNode(evidence[group][i]);
					var content = (evidenceNode.brief.length != 0) ? evidenceNode.brief : '(No Content)';
					graphStr += '		(' + nStoreToVisualIds[evidence[group][i]] + ') ' + content + '<br/>';
				}
				i++;
				graphStr += '</div>';
			}
			
			for (var group in inconsistent) {
				graphStr += '<div class="inconsistencyHeading">Inconsistency:</div>';
				graphStr += '<div class="inconsistency">';
				for (var i = 0; i < inconsistent[group].length; i++) {
					var inconsistentNode = messStore.getNode(inconsistent[group][i]);
					var content = (inconsistentNode.brief.length != 0) ? inconsistentNode.brief : '(No Content)';
					graphStr += '		(' + nStoreToVisualIds[inconsistent[group][i]] + ') ' + content + '<br/>';
				}
				graphStr += '</div>';
			}
			
			for (var group in questions) {
				graphStr += '<div class="questionHeading">Question:</div>';
				graphStr += '<div class="question">';
				for (var i = 0; i < questions[group].length; i++) {
					var questionNode = messStore.getNode(questions[group][i]);
					var content = (questionNode.brief.length != 0) ? questionNode.brief : '(No Content)';
					graphStr += '		(' + nStoreToVisualIds[questions[group][i]] + ') ' + content + '<br/>';
				}
				graphStr += '</div>';
			}
		}
		
		return graphStr;
	}
	
	this.toJSONString = function() {
		var graphObj = 
		{
			verts: [],
			edges: []
		};
		
		var doneNodes = {};	
		for (var visualId in nVisualToStoreIds) {
			var storeId = nVisualToStoreIds[visualId];
			var node = messStore.getNode(storeId);
			
			graphObj.verts.push(
			{
				id : id,
				brief : node.brief,
				thorough : node.thorough,
				main : node.main,
			});

			doneNodes[storeId] = 1;
			var nodeRels = messStore.getNodeRelationships(storeId);
			for (var nId in nodeRels) {
				if (!(nId in doneNodes)) { 
					var relationship = nodeRels[nId];
					graphObj.edges.push(
					{
						id1: nStoreToVisualIds[relationship.id1],
						id2: nStoreToVisualIds[relationship.id2],
						type: relationship.type,
						group: relationship.group,
						direction: relationship.direction,
						thorough: relationship.thorough
					});
				}
			}
		}
		
		return JSON.stringify(graphObj);
	}
	
	this.fromJSONString = function(graphStr) {
		var mainTag = messStore.getMainTag();
	
		if (!mainTag || mainTag.nodeCount > 0)
			return;
	
		/* FIXME: Do better filtering somewhere else */
		graphStr = graphStr.replace(/<span[^>]*>/mg, "")
						   .replace(/<\/span>/mg, "")
						   .replace(/<div[^>]*>/mg, "")
						   .replace(/<\/div>/mg, "")
						   .replace(/<br>/mg, "");
		var graphObj = JSON.parse(graphStr);
		var importedIdsToNewIds = {};
		
		for (var v = 0; v < graphObj.verts.length; v++) {
			var vert = graphObj.verts[v];
			var id = that.addVert(vert.brief, vert.thorough, vert.main);
			importedIdsToNewIds[vert.id] = id;
		}
		
		for (var e = 0; e < graphObj.edges.length; e++) {
			var edge = graphObj.edges[e];
			var thorough = "";
			if (edge.thorough) {
				thorough = edge.thorough;
			}
			this.addEdge(importedIdsToNewIds[edge.id1], importedIdsToNewIds[edge.id2], edge.type, edge.group, edge.direction, thorough, true);
		}
	}
}
