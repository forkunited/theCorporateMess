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
function MessGraph() {
	var that = this; 
	
	that.OBJ_TYPE_TAG = "tag";
	that.OBJ_TYPE_NODE = "node";
	that.OBJ_TYPE_RELATIONSHIP = "relationship";
	that.OBJ_TYPE_META_DATA = "metaData";
	
	var metaData = {};
	var tags = {};
	var tagIdsToNodeIds = {};
	var nodes = {};
	var relationships = {};
	
	this.appendObjects = function(graphObjs) {
		for (var i = 0; i < graphObjs.length; i++) {
			that.appendObject(graphObjs[i]);
		}
	}
	
	this.appendObject = function(graphObj) {
		if (graphObj.objType == that.OBJ_TYPE_TAG) {
			that.addTag(graphObj.tag);
		} else if (graphObj.objType == that.OBJ_TYPE_NODE) {
			that.addNode(graphObj.node); 
		} else if (graphObj.objType == that.OBJ_TYPE_RELATIONSHIP) {
			that.setRelationship(graphObj.relationship);
		} else if (graphObj.objType == that.OBJ_TYPE_META_DATA) {
			that.setMetaData(graphObj.metaData);
		}
	}
	
	this.setMetaData = function(newMetaData) {
		metaData = newMetaData;
		return true;
	}
	
	this.getMetaData = function() {
		return metaData;
	}
	
	this.addTag = function(tag, selected) {
		if (!selected)
			selected = false;
		tag.selected = selected;
		tags[tag.id] = tag;
		
		if (!(tag.id in tagIdsToNodeIds))
			tagIdsToNodeIds[tag.id] = [];
		
		return tag.id in tags;
	}
	
	this.hasTag = function(id) {
		return (id in tags);
	}
	
	this.getTag = function(id) {
		return tags[id];
	}
	
	this.getTagIds = function(id) {
		var tagIds = [];
		for (var id in tags)
			tagIds.push(id);
		return tagIds;
	}
	
	this.removeTag = function(id) {
		if (!(id in tags))
			return false;
			
		while (tagIdsToNodeIds[id].length > 0) {
			that.removeNode(tagIdsToNodeIds[id][i]);
		}
		
		delete tags[id];
		delete tagIdsToNodeIds[id];
		
		return true;
	}
	
	this.selectTag = function(id) {
		if (!(id in tags))
			return false;
		tags[id].selected = true;
		return true;
	}
	
	this.deselectTag = function(id, deselectedVisited) {
		if (!(id in tags))
			return false;
		tags[id].selected = false;
		
		if (!deselectedVisited)
			deselectedVisited = {};
		deselectedVisited[id] = 1;
		
		var i = 0;
		var relatedUnselectedTagIds = {};
		while (tagIdsToNodeIds[id].length > 0 && i < tagIdsToNodeIds[id].length) {
			var relatedTagIds = that.getNodeRelatedTagIds(tagIdsToNodeIds[id][i]);
			// Remove related unselected tags if they aren't related to anything anymore
			var relatedSelected = 0;
			for (var relatedTagId in relatedTagIds) {
				if (!(relatedTagId in deselectedVisited) && !tags[relatedTagId].selected) {
					var distantRelatedUnselected = that.deselectTag(relatedTagId, deselectedVisited); 
					for (var distantId in distantRelatedUnselected)
						relatedUnselectedTagIds[distantId] = 1;
					relatedUnselectedTagIds[relatedTagId] = 1;
				} else if ((relatedTagId in tags) && tags[relatedTagId].selected)
					relatedSelected++;
			}
			
			if (relatedSelected == 0) {
				that.removeNode(tagIdsToNodeIds[id][i]);
			} else {
				i++;
			}
		}

		if (tagIdsToNodeIds[id].length == 0) {
			delete tags[id];
			delete tagIdsToNodeIds[id];
		}
		
		return relatedUnselectedTagIds;
	}
	
	this.getNodeIdsByTagId = function(id) {
		if (!(id in tags))
			return undefined;
		var nodeIds =[];
		for (var i = 0 ; i < tagIdsToNodeIds[id].length; i++)
			nodeIds.push(tagIdsToNodeIds[id][i]);
		return nodeIds;
	}
	
	this.removeNodesByTagId = function(id) { 
		if (!(id in tags)) 
			return false;
			
		while (tagIdsToNodeIds[id].length > 0) {
			that.removeNode(tagIdsToNodeIds[id][0]);
		}
			
		return true;
	}
	
	this.addNode = function(node) {
		if (!(node.tagId in tagIdsToNodeIds))
			return false;
	
		if (node.deleted) {
			return that.removeNode(node.id);
		}
	
		if (!(node.id in nodes)) {
			tagIdsToNodeIds[node.tagId].push(node.id);	
			relationships[node.id] = {}		
		}
		
		if (!(node.id in nodes) || node.brief.indexOf("[") >= 0) // HACK for nodes with too many neighbors
			nodes[node.id] = node;
			
		return true;
	}
	
	this.hasNode = function(id) {
		return (id in nodes);
	}
	
	this.getNode = function(id) {
		return nodes[id];
	}
	
	this.getNodeRelationships = function(id) {
		return relationships[id];
	}
	
	this.getNodeRelatedTagIds = function(id, onlySelected) {
		var nodeRelationships = relationships[id];
		var relatedTagIds = {};
		for (var relatedNodeId in nodeRelationships) {
			if (nodes[id].tagId != nodes[relatedNodeId].tagId)
				if (!onlySelected || tags[nodes[relatedNodeId].tagId].selected)
					relatedTagIds[nodes[relatedNodeId].tagId] = 1;
		}
		return relatedTagIds;
	}
	
	this.getTagRelatedNodeIds = function(id, onlySelected) {
		var nodesUnderTag = tagIdsToNodeIds[id];
		var relatedNodeIds = {};
		for (var i = 0; i < nodesUnderTag.length; i++) {
			var nodeRelationships = relationships[nodesUnderTag[i]];
			for (var relatedNodeId in nodeRelationships)
				if (nodes[relatedNodeId].tagId != id)
					if (!onlySelected || tags[nodes[relatedNodeId].tagId].selected)
						relatedNodeIds[relatedNodeId] = 1;
		}
		return relatedNodeIds;
	}
	
	this.removeNode = function(id) {
		if (!(id in nodes))
			return false;
	
		for (var nId in relationships[id])
			delete relationships[nId][id];
		
		var tagId = nodes[id].tagId;
		tagIdsToNodeIds[tagId].splice(tagIdsToNodeIds[tagId].indexOf(id), 1);
		
		delete relationships[id];
		delete nodes[id];
		
		return true;
	}
	
	this.setRelationship = function(relationship) {
		if (!(relationship.id1 in nodes))
			return false;
		if (!(relationship.id2 in nodes))
			return false;
			
		if (relationship.deleted)
			return that.removeRelationship(relationship.id1, relationship.id2);
		else {
			relationships[relationship.id1][relationship.id2] = relationship;
			relationships[relationship.id2][relationship.id1] = relationship;
		}
		
		return true;
	}
	
	this.hasRelationship = function(id1, id2) {
		return (id1 in relationships) && (id2 in relationships[id1]);
	}
	
	this.getRelationship = function(id1, id2) {
		return relationships[id1][id2];
	}
	
	this.removeRelationship = function(id1, id2) {
		if (!(id1 in nodes))
			return false;
		if (!(id2 in nodes))
			return false;
			
		delete relationships[id1][id2];
		delete relationships[id2][id1];
			
		return true;
	}
}
