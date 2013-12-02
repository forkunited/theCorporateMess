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
function VisualGraph(canvas, overlayCanvas) {
	var that = this;  
	
	this.EPSILON = 1;
	
	/* Edge display modes */
	this.EDGE_DISPLAY_NORMAL = 0;
	this.EDGE_DISPLAY_HYPER = 1;
	
	/* For active viewing window */
	this.WINDOW_BUFFER_MULTIPLIER = 0.05;
	this.GRID_WIDTH_MULTIPLIER = 1.1;
	this.GRID_HEIGHT_MULTIPLIER = 1.1;	
	
	/* Scolling */
	var SCROLL_NONE = 0;
	var SCROLL_LEFT = 1;
	var SCROLL_RIGHT = 2;
	var SCROLL_DOWN = 4;
	var SCROLL_UP = 8;	
	var SCROLL_DELTA = 3;
	
	var ACTIVE_VERTS_CACHE_RETRIEVAL_SIZE = 20;
	
	var SMALL_GRID_WIDTH = 40;
	var SMALL_GRID_HEIGHT = 40;
	var CLOSE_GRID_SPACES = 10;
	
	var canvas = canvas;
	
	var highlightedPrefix = undefined;
	var highlightedVerts = [];
	
	var focusX = 0;
	var focusY = 0;
	var focusVertexId = undefined;
	var focusVertexSelected = false;
	var focusEdge = undefined;
	var focusEdgeSelected = false;
	
	var windowScrollFocusVertId = undefined;
	var windowScrollFocusX = undefined;
	var windowScrollFocusY = undefined;
	var windowScrollFocusEdge = undefined;
	
	var selectedVertices = [];
	var activeVertsCache = [];
	var activeVertsCacheIterator = 0;
	
	/* Window and Grid stuff */
	var windowTop = 0;
	var windowLeft = 0;
	var windowBuffer = canvas.height*this.WINDOW_BUFFER_MULTIPLIER;
	var gridWidth = canvas.width*this.GRID_WIDTH_MULTIPLIER;
	var gridHeight = canvas.height*this.GRID_HEIGHT_MULTIPLIER;	
	
	var fullVisibleWindow = { top: 0, left: 0, width: canvas.width, height: canvas.height }
	
	var curVertId = 1;
	
	var gridToVerts = {};
	var idsToVerts = {};
	var idsToEdges = {};
	var idsToHyperEdges = {}; // Currently based on edge color, but might be good to make more generic
	
	var edgeDisplayMode = that.EDGE_DISPLAY_NORMAL;//HYPER;
	
	var scrolling = SCROLL_NONE;
	var mouseScrollX = 0;
	var mouseScrollY = 0;
	var mouseScrollSourceX = 0;
	var mouseScrollSourceY = 0;
	
	var animation = new VisualAnimationSprings();
	animation.setAnimateClusters(false);
	animation.setAnimateVertices(true);
	
	var animationClusterer = new GraphClustererWeakComponents();
	animationClusterer.setGraphParts(idsToVerts, idsToEdges);
	
	var selectionBox = new VisualSelection(canvas, 0, 0);
	
	this.setEdgeDisplayMode = function(mode) {
		edgeDisplayMode = mode;
	}
	
	this.setAnimation = function(a) {
		animation = a;
	}
	
	this.setAnimationClusterer = function(c) {
		animationClusterer = c;
		if (!animationClusterer)
			return;
		animationClusterer.setGraphParts(idsToVerts, idsToEdges);
		animationClusterer.reset(getActiveVerts());
	}
	
	this.getAnimationClusterer = function() {
		return animationClusterer;
	}
	
	this.setFullVisibleWindow = function(top, left, height, width) {
		fullVisibleWindow.top = top;
		fullVisibleWindow.left = left;
		fullVisibleWindow.height = height;
		fullVisibleWindow.width = width;
	}
	
	this.addVert = function(label, colors, x, y, radius) {		
		var id = curVertId;
		var v = new VisualVertex(canvas, overlayCanvas, id, label, colors, fullVisibleWindow, windowLeft, windowTop, x, y, radius);
	
		idsToEdges[v.getID()] = {};
		idsToVerts[v.getID()] = v;
		
		if (highlightedPrefix) {
			idStr = v.getIDStr();
			if (idStr.indexOf(highlightedPrefix) == 0) {
				highlightedVerts.push(id);
				v.setIdHighlightIndex(highlightedPrefix.length-1);
			}
		}

		updateGrid(v, gridToVerts, gridWidth, gridHeight, v.getX(), v.getY());
		
		curVertId++;
		
		return id;
	}
	
	/* Set the goal position relative to the viewing window */
	this.setVertGoalPos = function(v, x, y) {
		if (!(v in idsToVerts))
			return;
		
		idsToVerts[v].setGoalPos(x,y);
	}
	
	
	this.setWindowScrollFocusVert = function(id, targetX, targetY) {
		if (windowScrollFocusEdge) {
			windowScrollFocusEdge = undefined;
		}
	
		windowScrollFocusVertId = id;
		windowScrollFocusX = targetX;
		windowScrollFocusY = targetY;
	}
	
	this.setWindowScrollFocusEdge = function(id1, id2, targetX, targetY) {
		if (windowScrollFocusVertId) {
			windowScrollFocusVertId = undefined;
		}
		
		if (!id1) {
			windowScrollFocusEdge = undefined;
			windowScrollFocusX = undefined;
			windowScrollFocusY = undefined;
		} else {
			windowScrollFocusEdge = idsToEdges[id1][id2];
			windowScrollFocusX = targetX;
			windowScrollFocusY = targetY;
		}
	}
	
	this.setVertAbsolutePos = function(v, x, y) {
		var oldX = v.getX();
		var oldY = v.getY();
		v.setPos(x, y);
		updateGrid(v, gridToVerts, gridWidth, gridHeight, oldX, oldY);
	}
	
	this.getVertAbsolutePosX = function(v) {
		return idsToVerts[v].getX();
	}
	
	this.getVertAbsolutePosY = function(v) {
		return idsToVerts[v].getY();
	}
	
	this.setVertLabelVisible = function(v, visible) {
		if (!(v in idsToVerts))
			return;
		
		idsToVerts[v].setLabelVisible(visible);		
	}
	
	this.setVertLabel = function(v, label) {
		if (!(v in idsToVerts))
			return;
		
		idsToVerts[v].setLabel(label);		
	}
	
	this.getVertLabel = function(v) {
		if (!(v in idsToVerts))
			return undefined;
		else
			return idsToVerts[v].getLabel();
	}
	
	this.setVertRadius = function(v, radius) {
		if (!(v in idsToVerts))
			return;
		idsToVerts[v].setRadius(radius);
	}
	
	this.colorVert = function(v, colors) {
		if (!(v in idsToVerts))
			return;
		idsToVerts[v].setColors(colors);
	}
	
	this.getEdgeType = function(v1, v2) {
		return idsToEdges[v1][v2].getEdgeType();
	}
	
	this.getEdgeDirection = function(v1, v2) {
		var edge = idsToEdges[v1][v2];
		var dir = edge.getEdgeDirection();
		if (dir == that.EDGE_DIR_BOTH || edge.getV1().getID() == v1) {
			return dir;
		} else if (dir == that.EDGE_DIR_FORWARD) {
			return that.EDGE_DIR_BACKWARD;
		} else {
			return that.EDGE_DIR_FORWARD;
		}
	}
	
	this.hasEdge = function(v1, v2) {
		return v1 in idsToEdges && v2 in idsToEdges[v1];
	}
	
	this.getEdgeColor = function(v1, v2) {
		return idsToEdges[v1][v2].getColor();
	}
	
	this.addEdgesSelected = function(color, direction) {
		var doneVerts = {};
		for (sv1 in selectedVertices) {
			var v1 = idsToVerts[selectedVertices[sv1]];
			doneVerts[selectedVertices[sv1]] = 1;
			for (sv2 in selectedVertices) {
				if (!(selectedVertices[sv2] in doneVerts)) {
					var v2 = idsToVerts[selectedVertices[sv2]];
					var e = new VisualEdge(canvas, v1, v2, color, direction);
					addEdge(e);
				}
			}
		}
	}
	
	this.addEdge = function(v1, v2, color, direction, type) {
		var e = new VisualEdge(canvas, idsToVerts[v1], idsToVerts[v2], color, direction);
		e.setEdgeType(type);
		addEdge(e);
	}
	
	this.editEdge = function(v1, v2, color, direction, type) {
		if (!(v1 in idsToEdges) || !(v2 in idsToEdges[v1]))
			return;
			
		var e = idsToEdges[v1][v2];
		setEdgeColor(e, color);
		setEdgeType(e, type, direction);
	}

	this.removeEdgesSelected = function() {
		for (sV1 in selectedVertices) {
			for (sV2 in selectedVertices) {
				if (sV1 != sV2 && selectedVertices[sV2] in idsToEdges[selectedVertices[sV1]]) {
					removeEdge(idsToEdges[selectedVertices[sV1]][selectedVertices[sV2]]);
				}
			}
		}
	}
	
	this.removeEdge = function(v1, v2) {
		var edge = idsToEdges[v1][v2];
		removeEdge(edge);
	}
	
	this.toggleDirectionEdgesSelected = function() {
		var doneVerts = {};
		for (sV1 in selectedVertices) {
			doneVerts[selectedVertices[sV1]] = 1;
			for (sV2 in selectedVertices) {
				if (!(selectedVertices[sV2] in doneVerts) && selectedVertices[sV2] in idsToEdges[selectedVertices[sV1]]) {
					var edge = idsToEdges[selectedVertices[sV1]][selectedVertices[sV2]];
					edge.swapDirection();
					setEdgeType(edge, edge.getEdgeType(), edge.getEdgeDirection());
				}
			}
		}
	}
	
	this.toggleDirectionEdge = function(v1, v2) {
		var edge = idsToEdges[v1][v2];
		edge.swapDirection();
		setEdgeType(edge, edge.getEdgeType(), edge.getEdgeDirection());
	}
	
	this.typeEdgesSelected = function(type, direction) {
		var doneVerts = {};
		for (sV1 in selectedVertices) {
			doneVerts[selectedVertices[sV1]] = 1;
			for (sV2 in selectedVertices) {
				if (!(selectedVertices[sV2] in doneVerts) && selectedVertices[sV2] in idsToEdges[selectedVertices[sV1]]) {
					setEdgeType(idsToEdges[selectedVertices[sV1]][selectedVertices[sV2]], type, direction);
				}
			}
		}
	}
	
	this.typeEdge = function(v1, v2, type, direction) {
		setEdgeType(idsToEdges[v1][v2], type, direction);
	}
	
	this.colorEdgesSelected = function(color) {
		var doneVerts = {};
		for (sV1 in selectedVertices) {
			doneVerts[selectedVertices[sV1]] = 1;
			for (sV2 in selectedVertices) {
				if (!(selectedVertices[sV2] in doneVerts) && selectedVertices[sV2] in idsToEdges[selectedVertices[sV1]]) {
					setEdgeColor(idsToEdges[selectedVertices[sV1]][selectedVertices[sV2]], color);
				}
			}
		}
	}
	
	this.colorEdge = function(v1, v2, color) {
		setEdgeColor(idsToEdges[v1][v2], color);
	}
	
	this.setEdgeFocusable = function(v1, v2, focusable) {
		idsToEdges[v1][v2].setFocusable(focusable);
	}
	
	this.removeVertsSelected = function() {
		for (id in selectedVertices) {
			removeVert(selectedVertices[id]);
		}
		
		selectedVertices = [];
	}
	
	this.removeVerts = function(vertsToRemove) {
		for (var id in vertsToRemove) {
			removeVert(vertsToRemove[id]);
		}
	}
	
	this.draw = function(context, overlayContext, activeVerts) {
		windowBuffer = canvas.height*this.WINDOW_BUFFER_MULTIPLIER;
		gridWidth = canvas.width*this.GRID_WIDTH_MULTIPLIER;
		gridHeight = canvas.height*this.GRID_HEIGHT_MULTIPLIER;	
	
		var drawn = {}
		if (!activeVerts)
			activeVerts = getActiveVerts();
		for (v1 in activeVerts) {
			if (edgeDisplayMode == that.EDGE_DISPLAY_NORMAL) {
				drawn[v1] = 1;
				for (v2 in idsToEdges[v1]) {
					if (!(v2 in drawn)) {
						idsToEdges[v1][v2].draw(context, windowLeft, windowTop);
					}
				}
			} else if (edgeDisplayMode == that.EDGE_DISPLAY_HYPER) {
				if (v1 in idsToHyperEdges) {
					for (var color in idsToHyperEdges[v1])
						idsToHyperEdges[v1][color].draw(context, windowLeft, windowTop);
				}
			} 
		}

		for (v in activeVerts) {
			idsToVerts[v].draw(context, overlayContext, fullVisibleWindow, windowLeft, windowTop);
		}
		
		selectionBox.draw(context, windowLeft, windowTop);
	}

	this.selectVert = function(v) {
		if (v) {
			if (v in idsToVerts && !idsToVerts[v].isSelected()) {
				selectedVertices.push(v);
				idsToVerts[v].toggleSelected();
			}
		} else {
			for (sv in selectedVertices) {
				idsToVerts[selectedVertices[sv]].toggleSelected();
			}
			selectedVertices = [];
		}
	}
	
	this.deselectVert = function(v) {
		if (v in idsToVerts) {
			var selectedIndex = selectedVertices.indexOf(v);
			if (selectedIndex >= 0) {
				selectedVertices.splice(selectedIndex, 1);
				idsToVerts[v].toggleSelected();
			}
		}
	}
	
	this.emphasizeVert = function(v) {
		if (v in idsToVerts) {
			idsToVerts[v].setEmphasized(true);
		}
	}
	
	this.deemphasizeVert = function(v) {
		if (v in idsToVerts) {
			idsToVerts[v].setEmphasized(false);
		}
	}
	
	this.emphasizeEdge = function(id1, id2) {
		if (!(id1 in idsToEdges) || !(id2 in idsToEdges[id1]))
			return;
		idsToEdges[id1][id2].setEmphasized(true);
	}
	
	this.deemphasizeEdge = function(id1, id2) {
		if (!(id1 in idsToEdges) || !(id2 in idsToEdges[id1]))
			return;
		idsToEdges[id1][id2].setEmphasized(false);
	}
	
	this.getSelectedVerts = function() {
		return selectedVertices;
	}
	
	this.getSelectedVertPairs = function() {
		var doneVerts = {};
		var retPairs = [];
		
		for (var i = 0; i < selectedVertices.length; i++) {
			var v1 = idsToVerts[selectedVertices[i]];
			doneVerts[selectedVertices[i]] = 1;
			for (var j = 0; j < selectedVertices.length; j++) {
				if (!(selectedVertices[j] in doneVerts)) {
					var v2 = idsToVerts[selectedVertices[j]];
					retPairs.push({ id1 : selectedVertices[i], id2 : selectedVertices[j] });
				}
			}
		}
		
		return retPairs;
	}
	
	this.appendHighlightedPrefix = function(s) {
		if (!highlightedPrefix) {
			highlightedPrefix = s;
			activeVerts = getActiveVerts();
			for (id in activeVerts) {
				idStr = idsToVerts[id].getIDStr();
				if (idStr.indexOf(highlightedPrefix) == 0) {
					highlightedVerts.push(id);
					idsToVerts[id].setIdHighlightIndex(highlightedPrefix.length-1);
				}
			}
			
			if (highlightedVerts.length == 0) {
				highlightedPrefix = undefined;
			}
		} else {
			oldHighlightedPrefix = highlightedPrefix;
			highlightedPrefix += s;
			var highlightChange = 0;
			for (var i = 0; i < highlightedVerts.length; i++) {
				var idStr = idsToVerts[highlightedVerts[i]].getIDStr();
				if (idStr.indexOf(highlightedPrefix) == 0) {
					idsToVerts[highlightedVerts[i]].setIdHighlightIndex(highlightedPrefix.length-1);
					highlightChange++;
				}
			}
				
			if (highlightChange == 0) {
				highlightedPrefix = oldHighlightedPrefix;			
			} else {
				var i = 0;
				while (i < highlightedVerts.length) {		
					var idStr = idsToVerts[highlightedVerts[i]].getIDStr();				
					if (idStr.indexOf(highlightedPrefix) != 0) {
						idsToVerts[highlightedVerts[i]].setIdHighlightIndex(-1); // Make unhighlighted
						highlightedVerts.splice(i,1);
					} else {
						i++;
					}
				}
			}
		}
	}
	
	this.shrinkHighlightedPrefix = function() {
		if (!highlightedPrefix)
			return;
		oldHighlightedPrefix = highlightedPrefix;
		this.resetHighlightedPrefix();
		this.appendHighlightedPrefix(oldHighlightedPrefix.substring(0,oldHighlightedPrefix.length-1));
	}
	
	this.resetHighlightedPrefix = function() {
		highlightedPrefix = undefined;
		for (id in highlightedVerts) {
			idsToVerts[highlightedVerts[id]].setIdHighlightIndex(-1);
		}
		highlightedVerts = [];
	}
	
	this.getHighlightedVerts = function() {
		return highlightedVerts;
	}
	
	this.getWindowLeft = function() {
		return windowLeft;
	}
	
	this.getWindowTop = function() {
		return windowTop;
	}
	
	this.setWindow = function(newWindowLeft, newWindowTop) {
		windowLeft = newWindowLeft;
		windowTop = newWindowTop;
	}
	
	this.scrollLeftOn = function() {
		if (!(scrolling & SCROLL_LEFT))
			scrolling = scrolling ^ SCROLL_LEFT;
	}
	
	this.scrollLeftOff = function() {
		if (scrolling & SCROLL_LEFT)
			scrolling = scrolling ^ SCROLL_LEFT;
	}
	
	this.scrollRightOn = function() {
		if (!(scrolling & SCROLL_RIGHT))
			scrolling = scrolling ^ SCROLL_RIGHT;
	}
	
	this.scrollRightOff = function() {
		if (scrolling & SCROLL_RIGHT)
			scrolling = scrolling ^ SCROLL_RIGHT;
	}

	this.scrollUpOn = function() {
		if (!(scrolling & SCROLL_UP))
			scrolling = scrolling ^ SCROLL_UP;
	}
	
	this.scrollUpOff = function() {
		if (scrolling & SCROLL_UP)
			scrolling = scrolling ^ SCROLL_UP;
	}
	
	this.scrollDownOn = function() {
		if (!(scrolling & SCROLL_DOWN))
			scrolling = scrolling ^ SCROLL_DOWN;
	}
	
	this.scrollDownOff = function() {
		if (scrolling & SCROLL_DOWN)
			scrolling = scrolling ^ SCROLL_DOWN;
	}
	
	function addEdgeHyperEdge(edge) {
		var id1 = edge.getV1().getID();
		var id2 = edge.getV2().getID();
	
		var targetId = id1;
		var colorGroup = edge.getColor();
		if (edge.getEdgeDirection() == VisualEdge.EDGE_DIR_FORWARD)
			targetId = id2;
		if (!(targetId in idsToHyperEdges))
			idsToHyperEdges[targetId] = {};
		if (!(colorGroup in idsToHyperEdges[targetId]))
			idsToHyperEdges[targetId][colorGroup] = new VisualHyperEdge(canvas, idsToVerts[targetId], colorGroup);
		idsToHyperEdges[targetId][colorGroup].addEdge(edge);
	}
	
	function removeEdgeHyperEdge(edge) {
		var id1 = edge.getV1().getID();
		var id2 = edge.getV2().getID();
		var color = edge.getColor();
	
		if ((id1 in idsToHyperEdges) && (color in idsToHyperEdges[id1]) && idsToHyperEdges[id1][color].hasEdge(id2)) {
			idsToHyperEdges[id1][color].removeEdge(id2);
			if (idsToHyperEdges[id1][color].edgeCount() == 0)
				delete idsToHyperEdges[id1][color];
		}
		
		if ((id2 in idsToHyperEdges) && (color in idsToHyperEdges[id2]) && idsToHyperEdges[id2][color].hasEdge(id1)) {
			idsToHyperEdges[id2][color].removeEdge(id1);
			if (idsToHyperEdges[id2][color].edgeCount() == 0)
				delete idsToHyperEdges[id2][color];
		}
	}
	
	
	function addEdge(e) {
		var id1 = e.getV1().getID();
		var id2 = e.getV2().getID();
	
		if (!(id1 in idsToEdges)) {
			idsToEdges[id1] = {}; 
		}
		
		if (!(id2 in idsToEdges)) {
			idsToEdges[id2] = {}; 
		}

		if (!(id2 in idsToEdges[id1])) {
			idsToEdges[id1][id2] = e;
			idsToEdges[id2][id1] = e;
		}
		
		addEdgeHyperEdge(e);
	}
	
	function removeEdge(e) {
		var id1 = e.getV1().getID();
		var id2 = e.getV2().getID();
		
		if (focusEdge &&
			((id1 == focusEdge.getV1().getID() && id2 == focusEdge.getV2().getID())
			|| (id2 == focusEdge.getV1().getID() && id1 == focusEdge.getV2().getID()))) {
			that.setFocusEdge(undefined);
		}
		
		delete idsToEdges[id1][id2];
		delete idsToEdges[id2][id1];
		
		removeEdgeHyperEdge(e);
	}
	
	function setEdgeColor(e, color) {
		var id1 = e.getV1().getID();
		var id2 = e.getV2().getID();
	
		removeEdgeHyperEdge(e);
		
		idsToEdges[id1][id2].setColor(color);
		
		addEdgeHyperEdge(e);
	}
	
	function setEdgeType(e, type, direction) {
		removeEdgeHyperEdge(e);
		
		e.setEdgeType(type);
		e.setEdgeDirection(direction);	
		
		addEdgeHyperEdge(e);
	}
	
	function removeVert(removeId) {
		if (removeId == focusVertexId) {
			that.setFocusVertex(undefined);
		} else if (focusEdge && (removeId == focusEdge.getV1().getID() || removeId == focusEdge.getV2().getID())) {
			that.setFocusEdge(undefined);
		}
	
		strId = String(removeId)
	
		while (highlightedVerts.indexOf(strId) >= 0) {
			highlightedVerts.splice(highlightedVerts.indexOf(strId),1);
		}	
		
		while (selectedVertices.indexOf(strId) >= 0) {
			selectedVertices.splice(selectedVertices.indexOf(strId),1);
		}
	
		for (key in gridToVerts) {
			delete gridToVerts[key][removeId];
		}
		
		delete idsToVerts[removeId];
		delete idsToEdges[removeId];
		
		for (id in idsToEdges) {
			if (removeId in idsToEdges[id]) {
				delete idsToEdges[id][removeId];
			}
		}
	}
	
	function getActiveVerts() {
		activeVerts = {};
	
		l = windowLeft - windowBuffer;
		r = windowLeft + canvas.width + windowBuffer;
		t = windowTop - windowBuffer;
		b = windowTop + canvas.height + windowBuffer;
		
		topLeftKey = getGridXPos(l,gridWidth) + ' ' + getGridYPos(t,gridHeight);
		topRightKey = getGridXPos(r,gridWidth) + ' ' + getGridYPos(t,gridHeight);
		bottomLeftKey = getGridXPos(l,gridWidth) + ' ' + getGridYPos(b,gridHeight);
		bottomRightKey = getGridXPos(r,gridWidth) + ' ' + getGridYPos(b,gridHeight);
		
		/* FIXME */
		keys = {};
		keys[topLeftKey] = 1;
		keys[topRightKey] = 1;
		keys[bottomLeftKey] = 1;
		keys[bottomRightKey] = 1;
		
		for (key in keys)
			for (id in gridToVerts[key])
				activeVerts[id] = 1;
		
		return activeVerts;
	}
	
	function getCloseVerts(x, y, grid, width, height, numClose) {
		var gridX = getGridXPos(x, width);
		var gridY = getGridYPos(y, height);
		var closeVerts = {};
		for (var closeX = gridX - numClose; closeX < gridX + numClose; closeX++) {
			for (var closeY = gridY - numClose; closeY < gridY + numClose; closeY++) {
				var key = closeX + ' ' + closeY;
				for (var id in grid[key])
					closeVerts[id] = 1;
			}
		}
		return closeVerts;
	}
	
	function getCachedActiveVerts() {
		if (activeVertsCache.length == 0) {
			var activeVerts = getActiveVerts();
			var activeVertsList = [];
			for (var id in activeVerts)
				activeVertsList.push(id);
			activeVertsCache = shuffle(activeVertsList);
		}
		
		var retActiveVerts = {};
		var i = 0;
		for (i = activeVertsCacheIterator; i < Math.min(activeVertsCacheIterator + ACTIVE_VERTS_CACHE_RETRIEVAL_SIZE, activeVertsCache.length); i++) {
			retActiveVerts[activeVertsCache[i]] = 1;
		}
		
		if (i >= activeVertsCache.length - 1) {
			activeVertsCache = [];
			activeVertsCacheIterator = 0;
		} else {
			activeVertsCacheIterator = i + 1;
		}
		
		return retActiveVerts;
	}
	
	/* From: http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array */
	function shuffle(array) {
	  var currentIndex = array.length
		, temporaryValue
		, randomIndex
		;

	  // While there remain elements to shuffle...
	  while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	  }

	  return array;
	}
	
	function updateGrid(v, grid, width, height, oldX, oldY) {
		var oldKey = getGridXPos(oldX, width) + ' ' + getGridYPos(oldY, height);
		if (oldKey in grid) {
			oldWindow = grid[oldKey];
			if (v.getID() in oldWindow) {
				delete oldWindow[v.getID()];
			}
			
			if (oldWindow.length == 0) {
				delete grid[oldKey];
			}
		}

		var x = v.getX();
		var y = v.getY();
		var key = getGridXPos(x, width) + ' ' + getGridYPos(y, height);
		
		if (!(key in grid)) {
			grid[key] = {};
		}
		
		grid[key][v.getID()] = 1;
	}
	
	function getGridXPos(x, width) {
		return Math.floor(x/width);
	}
	
	function getGridYPos(y, height) {
		return Math.floor(y/height);
	}
	
	this.hasFocusObject = function() {
		if (focusVertexId || focusEdge)
			return true;
		else
			return false;
	}
	
	this.getFocusVertexId = function() {
		return focusVertexId;
	}
	
	this.getFocusEdgeId1 = function() {
		if (!focusEdge)
			return undefined;
		return focusEdge.getV1().getID();
	}
	
	this.getFocusEdgeId2 = function() {
		if (!focusEdge)
			return undefined;
		return focusEdge.getV2().getID();
	}
	
	this.setFocusPoint = function(posX, posY, allowFocusObjectChange) {
		focusX = posX;
		focusY = posY;
		/*
		if (mouseScrollSourceX && mouseScrollSourceY) {
			mouseScrollX = that.MOUSE_SCROLL_MULTIPLIER*(focusX - mouseScrollSourceX);
			mouseScrollY = that.MOUSE_SCROLL_MULTIPLIER*(focusY - mouseScrollSourceY);
		}
		*/
		
		// Move focus vertex to focus position if selected
		if (focusVertexId && focusVertexSelected) {
			var vertObj = idsToVerts[focusVertexId];
			that.setVertAbsolutePos(vertObj, focusX + windowLeft, focusY + windowTop);
		} 
		
		if (!focusVertexSelected && allowFocusObjectChange) {
			var activeVerts = getActiveVerts();	
			for (var id in activeVerts) {
				if (idsToVerts[id].atPos(focusX, focusY, windowLeft, windowTop)) {
					that.setFocusVertex(id);
					return;
				}
			}
			
			for (var id in activeVerts) {
				var edges = idsToEdges[id];
				for (var id2 in edges) {
					if (edges[id2].atPos(focusX, focusY, windowLeft, windowTop)) {
						that.setFocusEdge(id, id2);
						return;
					}
				}
			}
		}
		
		if (selectionBox.isVisible()) {
			selectionBox.setCornerPos(focusX + windowLeft, focusY + windowTop); 
		}
	}
	
	this.setFocusVertex = function(v) {
		if (!v) {
			that.deemphasizeVert(focusVertexId);
			focusVertexId = undefined;
			focusVertexSelected = false;
			return;
		}
	
		if (focusEdge) {
			that.setFocusEdge(undefined);
		}
	
		if (focusVertexId)
			that.deemphasizeVert(focusVertexId);
		focusVertexId = v;
		that.emphasizeVert(focusVertexId);
	}
	
	this.setFocusEdge = function(id1, id2) {
		if (id1 && id2 && !idsToEdges[id1][id2].getFocusable())
			return;
	
		if (focusEdge)
			that.deemphasizeEdge(focusEdge.getV1().getID(), focusEdge.getV2().getID());
		
		if (!id1 || !id2) {
			focusEdge = undefined;
			focusEdgeSelected = false;
			return;
		}
	
		if (focusVertexId) {
			that.setFocusVertex(undefined);
		}

		focusEdge = idsToEdges[id1][id2];
		that.emphasizeEdge(id1, id2);
	}
	
	this.selectFocusPoint = function() {
		if (focusVertexId && !focusVertexSelected) {
			var vertObj = idsToVerts[focusVertexId];
			if (vertObj.atPos(focusX, focusY, windowLeft, windowTop)) {				
				focusVertexSelected = true;
				that.setVertAbsolutePos(vertObj, focusX + windowLeft, focusY + windowTop);
				//mouseScrollSourceX = undefined;
				//mouseScrollSourceY = undefined;
				return;
			}
		}
		
		selectionBox.setAnchorPos(focusX + windowLeft, focusY + windowTop);
		selectionBox.setCornerPos(focusX + windowLeft, focusY + windowTop); 
		selectionBox.setVisible(true);
		
		//mouseScrollSourceX = focusX;
		//mouseScrollSourceY = focusY;		
	}
	
	this.deselectFocusPoint = function(toggleSelect) {
		//mouseScrollSourceX = undefined;
		//mouseScrollSourceY = undefined;
		
		if (!focusVertexSelected) {
			if (toggleSelect)
				this.selectVert(undefined); // Deselect all 
		} else if (focusVertexId && focusVertexSelected) {
			focusVertexSelected = false;
			
			if (!toggleSelect)
				return;
			
			if (idsToVerts[focusVertexId].isSelected())
				this.deselectVert(focusVertexId);
			else
				this.selectVert(focusVertexId);
		} 
		
		if (selectionBox.isVisible()) {
			for (var id in activeVerts) {
				var v = idsToVerts[id];
				if (selectionBox.containsPos(v.getX(), v.getY())) {
					that.selectVert(id);
				}
			}			
			selectionBox.setVisible(false);
		}
	}
	
	/* Animation stuff */
	
	var requestAnimFrame = (function(callback) {
		return window.requestAnimationFrame || 
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame || 
		window.oRequestAnimationFrame || 
		window.msRequestAnimationFrame ||
		function(callback) {
			window.setTimeout(callback, 1000 / 60);
		};
	})();
	
	this.animate = function() {
		var context = canvas.getContext("2d");
		var overlayContext = overlayCanvas.getContext("2d");
		activeVerts = animationNextFrame();
		
		context.save();
		overlayContext.save();
		
		context.setTransform(1,0,0,1,0,0);
		overlayContext.setTransform(1,0,0,1,0,0);
		
		context.clearRect(0, 0, canvas.width, canvas.height);
		overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
		
		context.restore();
		overlayContext.restore();
		
		that.draw(context, overlayContext);

		requestAnimFrame(function() {
			that.animate();
		});
	}

	function animationNextFrame() {
		scroll();
	
		/*var centerX = windowLeft + fullVisibleWindow.left + fullVisibleWindow.width/2.0;
		var centerY = windowTop + fullVisibleWindow.top + fullVisibleWindow.height/2.0;	*/	
		var activeVerts = getActiveVerts();//getCachedActiveVerts(); //Doesn't help
		
		if (animationClusterer)
			animationClusterer.reset(activeVerts);
		
		if (animation) {
			animation.setGraphParts(idsToVerts, idsToEdges, idsToHyperEdges);
			animation.setVertPosFn(that.setVertAbsolutePos);
			animation.setAnimationClusterer(animationClusterer);
			
			animation.startNextFrame(activeVerts);
		}
		
		var smallGrid = {};
		for (var id in activeVerts) {
			updateGrid(idsToVerts[id], smallGrid, SMALL_GRID_WIDTH, SMALL_GRID_HEIGHT, 0, 0);
		}
		
		for (var id1 in activeVerts) {
			var v1 = idsToVerts[id1];
			var closeVerts = getCloseVerts(v1.getX(), v1.getY(), smallGrid, SMALL_GRID_WIDTH, SMALL_GRID_HEIGHT, CLOSE_GRID_SPACES);
			
			v1.animationNextFrame();
			
			if (v1.getGoalX()) {
				dVX = v1.getGoalX() + windowLeft - v1.getX();
				dVY = v1.getGoalY() + windowTop - v1.getY();
		  
				if (Math.sqrt(Math.pow(dVX,2) + Math.pow(dVY,2)) > that.EPSILON) {
					that.setVertAbsolutePos(v1, v1.getX()+dVX/5,v1.getY()+dVY/5); 
				} else {
					v1.setGoalPos(undefined, undefined);
				}
				
				continue;
			}
			
			if (id1 == focusVertexId || (focusEdge && (id1 == focusEdge.getV1().getID() || id1 == focusEdge.getV2().getID())))
				continue;
		  
			if (animation) {
				animation.vertNextFrame(v1, activeVerts, closeVerts);
			}
		}
		
		if (animation)
			animation.finishNextFrame(activeVerts);
			
		return activeVerts;
	}
	
	function scroll() {
		if (windowScrollFocusVertId || windowScrollFocusEdge) {
			var windowX = windowLeft + windowScrollFocusX;
			var windowY = windowTop + windowScrollFocusY;
			var dVX = 0;
			var dVY = 0;
			
			if (windowScrollFocusVertId) {
				var v = idsToVerts[windowScrollFocusVertId];
				dVX = windowX - v.getX();
				dVY = windowY - v.getY();
			} else { // windowScrollFocusEdge
				dVX = windowX - windowScrollFocusEdge.getCenterX();
				dVY = windowY - windowScrollFocusEdge.getCenterY();
			}
	  
			if  (Math.sqrt(Math.pow(dVX,2) + Math.pow(dVY,2)) > that.EPSILON) {
				that.resetHighlightedPrefix();
				windowLeft -= dVX/5;
				windowTop -= dVY/5;
			}		
			
			return;
		}
	
		if (scrolling & SCROLL_LEFT) {
			that.resetHighlightedPrefix();
			windowLeft -= SCROLL_DELTA;
		} 
		
		if (scrolling & SCROLL_RIGHT) {
			that.resetHighlightedPrefix();
			windowLeft += SCROLL_DELTA;		
		}
		
		if (scrolling & SCROLL_DOWN) {
			that.resetHighlightedPrefix();
			windowTop += SCROLL_DELTA;	
		}
		
		if (scrolling & SCROLL_UP) {
			that.resetHighlightedPrefix();
			windowTop -= SCROLL_DELTA;		
		}
		/* Add in for mouse scrolling
		windowLeft -= mouseScrollX;
		windowTop -= mouseScrollY;
		
		if (Math.abs(mouseScrollX) > 0) mouseScrollX += ((mouseScrollX > 0) ? -1 : 1);
		if (Math.abs(mouseScrollY) > 0) mouseScrollY += ((mouseScrollY > 0) ? -1 : 1);
		*/
	}
}
