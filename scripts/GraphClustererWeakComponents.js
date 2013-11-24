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
function GraphClustererWeakComponents() {
	var that = this;  
	
	var vertsIdsToClusters = {};
	var clusterIdsToClusters = {};
	var clusterIds = [];
	var disjointSets = {};
	var idsToVerts = {};
	var idsToEdges = {};
	
	this.setGraphParts = function(newIdsToVerts, newIdsToEdges) {
		idsToVerts = newIdsToVerts;
		idsToEdges = newIdsToEdges;
	}
	
	this.reset = function(activeVerts) {
		disjointSets = {};
		vertIdsToClusters = {};
		clusterIdsToClusters = {};
		clusterIds = [];
		
		// Union-find on active verts
		for (var id in activeVerts) {
			if (!(id in disjointSets))
				disjointSets[id] = { id : id, rank : 0, parent : id, edgeCount : 0 };
			for (var nId in idsToEdges[id]) {
				if (!(nId in disjointSets)) {
					disjointSets[nId] = { id : nId, rank : 0, parent : nId, edgeCount : 0 };
				}
				
				// This includes some non-active verts in the 
				// data-structure, but this is probably faster
				// than O(|activeVerts|^2) assuming that graph is
				// sparse, and that most active vertex neighbors
				// are also active vertices
				union(id, nId);
					
				disjointSets[id].edgeCount++;
			}
		}

		// Build map from vert ids to clusters
		for (var id in activeVerts) {
			var clusterId = find(id);
			if (clusterId in clusterIdsToClusters) {
				clusterIdsToClusters[clusterId].cluster.push(id);
				clusterIdsToClusters[clusterId].edgeCount += disjointSets[id].edgeCount;
				clusterIdsToClusters[clusterId].posXSum += idsToVerts[id].getX();
				clusterIdsToClusters[clusterId].posYSum += idsToVerts[id].getY();
				vertIdsToClusters[id] = clusterIdsToClusters[clusterId];
			} else {
				var cluster = { clusterId : clusterId, cluster : [id], edgeCount : disjointSets[id].edgeCount, posXSum : idsToVerts[id].getX(), posYSum : idsToVerts[id].getY()  };
				clusterIdsToClusters[clusterId] = cluster;
				vertIdsToClusters[id] = cluster;
				clusterIds.push(clusterId);
			}
		}
		
		disjointSets = undefined; // Conserve memory...
	}
	
	function union(vertId1, vertId2) {
		root1 = disjointSets[find(vertId1)];
		root2 = disjointSets[find(vertId2)];
		
		if (root1.id == root2.id)
			return;
		
		if (root1.rank < root2.rank)
			root1.parent = root2.id;
		else if (root1.rank > root2.rank)
			root2.parent = root1.id;
		else {
			root2.parent = root1.id;
			root1.rank++;
		}
	}
	
	function find(vertId) {
		var v = disjointSets[vertId];
		if (v.parent != v.id)
			v.parent = find(v.parent);
		return v.parent;
	}
	
	/* The following methods are redundant across clustering classes.  Might
	 * want place them in a parent class in the future.  They are kept
	 * defined redundantly for now to highlight the fact that the values
	 * that they return are computed by redundant code across "reset"
	 * methods.  The "reset" methods contain redundant code because eliminating
	 * the redundancy is difficult without sacrificing efficiency, and it's
	 * important that the clustering classes remain as efficient as
	 * possible because they are used repeatedly to compute animation frames
	 */
	
	this.getClusterIdFromVertId = function(vertId) {
		return vertIdsToClusters[vertId].clusterId;
	}
	
	this.getClusterFromVertId  = function(vertId) {
		return vertIdsToClusters[vertId].cluster;
	}
	
	this.getClusterEdgeCountFromVertId  = function(vertId) {
		return vertIdsToClusters[vertId].edgeCount;
	}
	
	this.getClusterMeanPosXFromVertId  = function(vertId) {
		return vertIdsToClusters[vertId].posXSum/vertIdsToClusters[vertId].cluster.length;
	}
	
	this.getClusterMeanPosYFromVertId = function(vertId) {
		return vertIdsToClusters[vertId].posYSum/vertIdsToClusters[vertId].cluster.length;
	}
	
	this.getClusterIds = function() {
		// FIXME: Not implemented
		return clusterIds;
	}
	
	this.getClusterNeighbors = function(clusterId) {
		return []; // Not possible for a cluster to have neighbors	
	}
	
	this.getClusterMeanPosX = function(clusterId) {
		return clusterIdsToClusters[clusterId].posXSum/clusterIdsToClusters[clusterId].cluster.length;
	}
	
	this.getClusterMeanPosY = function(clusterId) {
		return clusterIdsToClusters[clusterId].posYSum/clusterIdsToClusters[clusterId].cluster.length;
	}
}
