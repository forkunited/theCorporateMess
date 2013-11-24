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

/* This class is no longer used... fix it up later if radial
 * layout seems useful.
 */
function VisualAnimationRadial() {
	var that = this;  
	
	this.VERTEX_REPULSIVE_FORCE_MULTIPLIER = 30000;//5000;//500;//1000//2000;
	this.VERTEX_ATTRACTIVE_FORCE_MULTIPLIER = .1;//.0025;//.0005;//.001//.005;
	this.VERTEX_RADIAL_FORCE_MULTIPLIER = 5;//5;
	
	this.EPSILON = 10;	
	this.FULL_SEARCH_PROBABILITY = .05; 
	this.LEVEL_RADIUS_INCREMENT = 50;//100;
	this.LEVEL_WIDTH_MULTIPLIER = 100;
	
	var idsToLevels = {};
	var centerX;
	var centerY;
	
	this.startNextFrame = function(animationClusterer) {
		// FIXME
	}
	
	this.finishNextFrame = function(animationClusterer) {
		// FIXME
	}
	
	this.vertNextFrame = function(vert, activeVerts, idsToVerts, idsToEdges, setVertPos, cX, cY, animationClusterer) {
		if (Math.random() <= that.FULL_SEARCH_PROBABILITY)
			fullSearchVertLevel(vert.getID(), idsToEdges, activeVerts);
		//else 
		//	quickSearchVertLevel(vert.getID(), idsToEdges, activeVerts);

		if (!centerX || !centerY) {
			centerX = cX;
			centerY = cY;
		}
		
		/* Compute spring based forces */
		var vertFX = 0;
		var vertFY = 0;           
		for (v2 in activeVerts) {
			if (vert.getID() != v2) {//if (!(vert.getID() in idsToLevels) || !(v2 in idsToLevels) || idsToLevels[vert.getID()] != idsToLevels[v2]) {
				var vert2 = idsToVerts[v2];
				var dVX = vert.getX() - vert2.getX();
				var dVY = vert.getY() - vert2.getY();

				if (dVX != 0 || dVY != 0) {
					var dVNorm = Math.max(that.EPSILON, Math.sqrt(Math.pow(dVX,2)+Math.pow(dVY,2)));
					vertFX += dVX*that.VERTEX_REPULSIVE_FORCE_MULTIPLIER/Math.pow(dVNorm, 3.4);
					vertFY += dVY*that.VERTEX_REPULSIVE_FORCE_MULTIPLIER/Math.pow(dVNorm, 3.4);
				
					/* If edge then do stuff */ 
					if ((vert.getID() in idsToEdges && v2 in idsToEdges[vert.getID()]) || (v2 in idsToEdges && vert.getID() in idsToEdges[v2])) {
						vertFX += -that.VERTEX_ATTRACTIVE_FORCE_MULTIPLIER*dVX;
						vertFY += -that.VERTEX_ATTRACTIVE_FORCE_MULTIPLIER*dVY;
					}
				}
			}
		}
		
		if (!(vert.getID() in idsToLevels)) {
			setVertPos(vert, vert.getX()+vertFX, vert.getY()+vertFY);
			return;
		}
		
		/* Compute normalized vector from center of circle, and a vector which is perpendicular to it */
		var vertMagR = Math.sqrt(Math.pow(centerX-vert.getX(),2) + Math.pow(centerY-vert.getY(),2));
		var vertNormRX = (centerX - vert.getX())/vertMagR;
		var vertNormRY = (centerY - vert.getY())/vertMagR;
		
		var rF = radialForceMag(vert.getX(), vert.getY(), centerX, centerY, idsToLevels[vert.getID()]);
		var rFSign = radialForceSign(vert.getX(), vert.getY(), centerX, centerY, idsToLevels[vert.getID()]);
		setVertPos(vert,
				   vert.getX() + (1-rF)*vertFX + rF*vertNormRX*rFSign*that.VERTEX_RADIAL_FORCE_MULTIPLIER,
				   vert.getY() + (1-rF)*vertFY + rF*vertNormRY*rFSign*that.VERTEX_RADIAL_FORCE_MULTIPLIER);
	}
	
	function radialForceMag(x, y, centerX, centerY, level) {
		var locCenterDist = Math.sqrt(Math.pow(x-centerX, 2) + Math.pow(y-centerY,2));
		var levelDist = (level+1)*that.LEVEL_RADIUS_INCREMENT;

		return -Math.pow(Math.E,-Math.pow((locCenterDist-levelDist)/that.LEVEL_WIDTH_MULTIPLIER,2))+1;
		//return Math.abs(1.0/(1.0+Math.pow(Math.E,-that.LEVEL_WIDTH_INVERSE_MULTIPLIER*(locCenterDist-levelDist)))-.5);
	}
	
	function radialForceSign(x, y, centerX, centerY, level) {
		var locCenterDist = Math.sqrt(Math.pow(x-centerX, 2) + Math.pow(y-centerY,2));
		var levelDist = (level+1)*that.LEVEL_RADIUS_INCREMENT;
		
		if (locCenterDist - levelDist > 0)
			return 1;
		else
			return -1;
	}
	
	function quickSearchVertLevel(vertID, idsToEdges, activeVerts) {
		var level = Number.MAX_VALUE;
		for (var neighbor in idsToEdges[vertID]) {
			var edge = idsToEdges[vertID][neighbor];
			if ((edge.getV1().getID() == vertID && edge.getEdgeDirection() == VisualEdge.EDGE_DIR_FORWARD) |
				(edge.getV2().getID() == vertID && edge.getEdgeDirection() == VisualEdge.EDGE_DIR_BACKWARD)) {
				if (neighbor in idsToLevels)
					level = Math.min(level, idsToLevels[neighbor]+1);
			}
		}
		
		if (level == Number.MAX_VALUE)
			level = 0;
			
		idsToLevels[vertID] = level;
	}
	
	function fullSearchVertLevel(vertID, idsToEdges, activeVerts) {
		// Note that queue might be slow, so replace this
		// with better queue if necessary
		var queue = searchActiveRoots(vertID, idsToEdges, activeVerts);
		var visited = {};

		for (var i = 0; i < queue.length; i++) {
			idsToLevels[queue[i]] = 0;
		}
		
		while (queue.length > 0) {
			var current = queue.shift();
			visited[current] = 1;
		
			for (var neighbor in idsToEdges[current]) {
				var edge = idsToEdges[current][neighbor];
				if ((edge.getV1().getID() == current && edge.getEdgeDirection() == VisualEdge.EDGE_DIR_BACKWARD) ||
					(edge.getV2().getID() == current && edge.getEdgeDirection() == VisualEdge.EDGE_DIR_FORWARD)) {
					
					if (neighbor in visited)
						continue;
					
					idsToLevels[neighbor] = idsToLevels[current] + 1;
					queue.push(neighbor);
				}
			}
		}
	}
	
	function searchActiveRoots(vertID, idsToEdges, activeVerts) {
		var stack = [vertID];
		var visited = {};
		var roots = [];
		while (stack.length > 0) {
			var current = stack.pop();
			var neighborCount = 0;
			visited[current] = 1;
			for (var neighbor in idsToEdges[current]) {
				var edge = idsToEdges[current][neighbor];
				if ((edge.getV1().getID() == current && edge.getEdgeDirection() == VisualEdge.EDGE_DIR_FORWARD) ||
					(edge.getV2().getID() == current && edge.getEdgeDirection() == VisualEdge.EDGE_DIR_BACKWARD)) {
					
					if (!(neighbor in activeVerts))
						continue;
					
					neighborCount++;
					if (neighbor in visited)
						continue;
					
					stack.push(neighbor);
				}
			}
			
			if (neighborCount == 0)
				roots.push(current);
		}
		
		if (roots.length == 0)
			roots.push(vertID);
			
		return roots;
	}
}
