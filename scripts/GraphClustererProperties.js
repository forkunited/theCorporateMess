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
function GraphClustererProperties(propertyFn) {
	var that = this;  
	
	var vertsIdsToClusters = {};
	var propertiesToClusters = {};
	var clustersToNeighbors = {};
	var clusterIds = [];
	
	var idsToVerts = {};
	var idsToEdges = {};
	
	this.setGraphParts = function(newIdsToVerts, newIdsToEdges) {
		idsToVerts = newIdsToVerts;
		idsToEdges = newIdsToEdges;
	}
	
	this.addVert = function(id) {
		var p = propertyFn(idsToVerts[id]);
		var vertPosX = idsToVerts[id].getX();
		var vertPosY = idsToVerts[id].getY();
		
		if (p in propertiesToClusters) {
			var pCluster = propertiesToClusters[p];
			
			pCluster.cluster.push(id);
			pCluster.posXSum += vertPosX;
			pCluster.posYSum += vertPosY;
			
			vertIdsToClusters[id] = pCluster;
		} else {
			var cluster = { clusterId : p, 
							cluster: [id], 
							posXSum : vertPosX, 
							posYSum : vertPosY
						  };
			propertiesToClusters[p] = cluster;
			vertIdsToClusters[id] = cluster;
			clusterIds.push(p);
		}
		
		if (!(p in clustersToNeighbors))
			clustersToNeighbors[p] = {};
			
		for (var nId in idsToEdges[id]) {
			var np = propertyFn(idsToVerts[id]);
			if (!(np in clustersToNeighbors))
				clustersToNeighbors[p][np] = 0;
			clustersToNeighbors[p][np]++;
		}	
	}
	
	this.reset = function(activeVerts) {
		propertiesToClusters = {};
		vertIdsToClusters = {};
		clustersToNeighbors = {};
		clusterIds = [];
		
		for (var id in activeVerts) {
			this.addVert(id);
		}
	}
	
	this.getClusterIdFromVertId = function(vertId) {
		return vertIdsToClusters[vertId].clusterId;
	}
	
	this.getClusterFromVertId = function(vertId) {
		return vertIdsToClusters[vertId].cluster;
	}
	
	this.getClusterEdgeCountFromVertId = function(vertId) {
		// FIXME: Not implemented
		return undefined;
	}
	
	this.getClusterMeanPosXFromVertId = function(vertId) {
		return vertIdsToClusters[vertId].posXSum/vertIdsToClusters[vertId].cluster.length;
	}
	
	this.getClusterMeanPosYFromVertId = function(vertId) {
		return vertIdsToClusters[vertId].posYSum/vertIdsToClusters[vertId].cluster.length;
	}
	
	this.getClusterIds = function() {
		return clusterIds;
	}
	
	this.getClusterNeighbors = function(clusterId) {
		return clustersToNeighbors[clusterId];
	}
	
	this.getClusterMeanPosX = function(clusterId) {
		return propertiesToClusters[clusterId].posXSum/propertiesToClusters[clusterId].cluster.length;
	}
	
	this.getClusterMeanPosY = function(clusterId) {
		return propertiesToClusters[clusterId].posYSum/propertiesToClusters[clusterId].cluster.length;
	}
}
