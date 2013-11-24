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
function MessHistory(messControl) {
	var that = this; 
	
	var ignoreChanges = false;
	var changes = [];
	
	this.MAX_CHANGES = 25;
	
	this.undo = function() {
		if (changes.length == 0)
			return;
	
		ignoreChanges = true;
		
		var recentChange = changes.pop();
		reverseChange(recentChange);
		
		ignoreChanges = false;
	}
	
	this.backtrack = function() {
		if (changes.length == 0)
			return;
			
		changes.pop();
	}
	
	this.addVert = function(localId) {		
		var change = {changeType:"addVert", vert: { localId: localId }};
		addChange(change);
	}
	
	this.addEdge = function(localId1, localId2) {
		var change = {changeType:"addEdge", edge: { localId1: localId1, localId2: localId2 }};
		addChange(change);
	}
	
	this.overwriteVert = function(localId, oldVert) {
		var change = {changeType:"overwriteVert", 
					  oldVert: { localId: localId, brief: oldVert.brief, thorough: oldVert.thorough, main: oldVert.main }
					 };
		addChange(change);
	}
	
	this.overwriteEdge = function(localId1, localId2, oldEdge) {
		var change = {changeType:"overwriteEdge", 
					  oldEdge: { localId1: localId1, localId2: localId2, type: oldEdge.type, group: oldEdge.group, direction: oldEdge.direction, thorough: oldEdge.thorough }
					 };
		addChange(change);
	}
	
	this.removeVert = function(localId, vert) {
		var change = {changeType:"removeVert", vert : { localId: localId, brief: vert.brief, thorough: vert.thorough, main: vert.main } };
		addChange(change);
	}
	
	this.removeEdge = function(localId1, localId2, edge) {
		var change = {changeType:"removeEdge", edge : { localId1: localId1, localId2: localId2, type: edge.type, group: edge.group, direction: edge.direction, thorough: edge.thorough } };
		addChange(change);
	}
	
	function addChange(change) {
		if (ignoreChanges)
			return;
		
		changes.push(change);
		if (changes.length > that.MAX_CHANGES)
			changes.shift();
	}
	
	function reverseChange(change) {
		if (change.changeType == "addVert") {
			messControl.removeVert(change.vert.localId, true);
		} else if (change.changeType == "addEdge") {
			messControl.removeEdge(change.edge.localId1, change.edge.localId2, true);
		} else if (change.changeType == "overwriteVert") {
			messControl.overwriteVert(change.oldVert.localId, change.oldVert.brief, change.oldVert.thorough, change.oldVert.main, true); 
		} else if (change.changeType == "overwriteEdge") {
			messControl.overwriteEdge(change.oldEdge.localId1, change.oldEdge.localId2, change.oldEdge.type, change.oldEdge.group, change.oldEdge.direction, change.oldEdge.thorough, true);
		} else if (change.changeType == "removeVert") {
			messControl.addVert(change.vert.brief, change.vert.thorough, change.vert.main);
		} else if (change.changeType == "removeEdge") {
			messControl.addEdge(change.edge.localId1, change.edge.localId2, change.edge.type, change.edge.group, change.edge.direction, change.edge.thorough, true);
		}
	}
}
