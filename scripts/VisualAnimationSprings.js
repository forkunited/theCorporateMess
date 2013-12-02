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
function VisualAnimationSprings() {
	var that = this;  
	
	this.VERTEX_REPULSIVE_FORCE_MULTIPLIER = 25000;//30000;//30000;//5000;//500;//1000//2000;
	this.VERTEX_ATTRACTIVE_FORCE_MULTIPLIER = .1;//.1;//.0075;//.0025;//.0005;//.001//.005;
	this.VERTEX_HYPER_EDGE_ATTRACTIVE_FORCE_MULTIPLIER = .025;//.1;//.0075;//.0025;//.0005;//.001//.005;
	this.EPSILON = 10;	
	this.SEPARATE_CLUSTER_FORCE_DIVISOR = 8.0;
	this.SAME_CLUSTER_FORCE_DIVISOR = 2.0;
	this.SAME_CLUSTER_SIZE_REDUCTION_THRESHOLD = 5.0;
	this.SAME_CLUSTER_DENSITY_REDUCTION_THRESHOLD = .9;
	
	var animateHyperEdges = true;
	var animateClusters = false;
	var animateVertices = true;
	var idsToVerts = undefined;
	var idsToEdges = undefined;
	var idsToHyperEdges = undefined;
	var vertPosFn = undefined;
	var animationClusterer = undefined;
	
	var clusterForces = undefined;
	
	this.setAnimateHyperEdges = function(value) {
		animateHyperEdges = value;
	}
	
	this.setAnimateClusters = function(value) {
		animateClusters = value;
	}
	
	this.setAnimateVertices = function(value) {
		animateVertices = value;
	}
	
	this.setGraphParts = function(newIdsToVerts, newIdsToEdges, newIdsToHyperEdges) {
		idsToVerts = newIdsToVerts;
		idsToEdges = newIdsToEdges;
		idsToHyperEdges = newIdsToHyperEdges;
	}
	
	this.setVertPosFn = function(value) {
		vertPosFn = value;
	}
	
	this.setAnimationClusterer = function(value) {
		animationClusterer = value;
	}
	
	this.startNextFrame = function(activeVerts) {
		if (!animateClusters)
			return;
			
		clusterForces = {};
	}
	
	this.finishNextFrame = function(activeVerts) {
		if (!animateClusters)
			return;
		
		for (var id in activeVerts) {
			var clusterId = animationClusterer.getClusterIdFromVertId(id);
			if (clusterId in clusterForces) {
				var clusterSize = animationClusterer.getClusterFromVertId(id).length;
				var vertFX = clusterForces[clusterId].x/(that.SEPARATE_CLUSTER_FORCE_DIVISOR*clusterSize*clusterSize);
				var vertFY = clusterForces[clusterId].y/(that.SEPARATE_CLUSTER_FORCE_DIVISOR*clusterSize*clusterSize);
				var vert = idsToVerts[id];
				
				vertPosFn(vert, vert.getX()+vertFX, vert.getY()+vertFY);
			}
		}
		
		clusterForces = undefined;
	}
	
	this.vertNextFrame = function(vert, activeVerts, closeVerts) {
		var vertFX = 0;
		var vertFY = 0;
		var clusterFX = 0;
		var clusterFY = 0;
		
		var clusterId = ""; 
		var clusterSize = 0;
		var clusterEdgeCount = 0;
		var clusterDensity = 0;
		
		var attractorCount = 0;
		
		if (animationClusterer) {
			clusterId = animationClusterer.getClusterIdFromVertId(vert.getID());
			clusterSize = animationClusterer.getClusterFromVertId(vert.getID()).length;
			clusterEdgeCount = animationClusterer.getClusterEdgeCountFromVertId(vert.getID());
			clusterDensity = 2.0*clusterEdgeCount/(clusterSize*(clusterSize - 1.0));
		}
		
		for (var v2 in closeVerts) {
			if (vert.getID() != v2) {
				var vert2 = idsToVerts[v2];
				var dVX = vert.getX() - vert2.getX();
				var dVY = vert.getY() - vert2.getY();
					
				if (dVX != 0 || dVY != 0) {
					var clusterId2 = (animationClusterer) ? animationClusterer.getClusterIdFromVertId(vert2.getID()) : "";
					var clusterReduction = 1.0;
					
					var dVNorm = Math.max(that.EPSILON, Math.sqrt(Math.pow(dVX,2)+Math.pow(dVY,2)));
					var baseRepulsiveFX = dVX*that.VERTEX_REPULSIVE_FORCE_MULTIPLIER/Math.pow(dVNorm, 3.1);//3.4);
					var baseRepulsiveFY = dVY*that.VERTEX_REPULSIVE_FORCE_MULTIPLIER/Math.pow(dVNorm, 3.1);//3.4);
					
					if (clusterId != clusterId2) {
						clusterReduction = (clusterSize == 1) ? 0 : 1.0/(that.SEPARATE_CLUSTER_FORCE_DIVISOR*clusterSize*animationClusterer.getClusterFromVertId(vert2.getID()).length);
						clusterFX += baseRepulsiveFX;
						clusterFY += baseRepulsiveFY;
					}
					
					vertFX += clusterReduction*baseRepulsiveFX;
					vertFY += clusterReduction*baseRepulsiveFY;
					
					/* Alternative idea for repulsive force...
					vertFX += dVX*that.VERTEX_REPULSIVE_FORCE_MULTIPLIER/(1.0+Math.pow(Math.E, (dVNorm-50.0)/1000.0));
					vertFY += dVY*that.VERTEX_REPULSIVE_FORCE_MULTIPLIER/(1.0+Math.pow(Math.E, (dVNorm-50.0)/1000.0));
					*/
					
					// Cluster force reduction for connected verts
					if (clusterSize > that.SAME_CLUSTER_SIZE_REDUCTION_THRESHOLD &&
						clusterDensity > that.SAME_CLUSTER_DENSITY_REDUCTION_THRESHOLD) {
						clusterReduction = 1.0/(that.SAME_CLUSTER_FORCE_DIVISOR*clusterSize);
					}
				}
			}
		}
		
		var id = vert.getID();
		if (id in idsToEdges) {
			for (var id2 in idsToEdges[id]) {
				attractorCount++;
			
				var baseAttractiveFX = -that.VERTEX_ATTRACTIVE_FORCE_MULTIPLIER*dVX;
				var baseAttractiveFY = -that.VERTEX_ATTRACTIVE_FORCE_MULTIPLIER*dVY;

				vertFX += clusterReduction*baseAttractiveFX;
				vertFY += clusterReduction*baseAttractiveFY;
				
				if (clusterId != clusterId2) {
					clusterFX += baseAttractiveFX;
					clusterFY += baseAttractiveFY;
				}
				
				if (animateHyperEdges) {
					var colorGroup = idsToEdges[v2][vert.getID()].getColor();
					if (
							v2 in idsToHyperEdges 
						&& colorGroup in idsToHyperEdges[v2]
						&& vert.getID() in idsToHyperEdges[v2][colorGroup].getSourcesToEdges()
						) {
							var hyperSources = idsToHyperEdges[v2][colorGroup].getSourcesToEdges();
							for (var s in hyperSources) {
								if (s != vert.getID() && s in activeVerts && !(s in idsToEdges[vert.getID()])) {
									var sVert = idsToVerts[s];
									var dSX = vert.getX() - sVert.getX();
									var dSY = vert.getY() - sVert.getY();
									vertFX += -that.VERTEX_HYPER_EDGE_ATTRACTIVE_FORCE_MULTIPLIER*dSX*clusterReduction;
									vertFY += -that.VERTEX_HYPER_EDGE_ATTRACTIVE_FORCE_MULTIPLIER*dSY*clusterReduction;
								}
							}
						}
				}
			}
		}
		
		if (animateVertices) {
			// HACK: Magic constants (good chance of changing this later)
			var vertFMag = Math.sqrt(Math.pow(vertFX, 2.0)+Math.pow(vertFY, 2.0));
			if (vertFMag > 25.0/(attractorCount+1.0)) {
				vertFX = (5.0/(attractorCount/10.0+1.0))*vertFX/vertFMag;
				vertFY = (5.0/(attractorCount/10.0+1.0))*vertFY/vertFMag;
			}
			vertPosFn(vert, vert.getX()+vertFX, vert.getY()+vertFY);
		}
	
		if (animateClusters) {
			if (!(clusterId in clusterForces))
				clusterForces[clusterId] = { x: 0, y: 0 };
			clusterForces[clusterId].x += clusterFX;
			clusterForces[clusterId].y += clusterFY;
		}
	}
}
