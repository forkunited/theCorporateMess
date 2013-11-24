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
function VisualHyperEdge(canvas, targetVert, color) {	
	var TRIANGLE_LENGTH = 10;
	var BEZIER_MEAN_DIVISOR = 2.0;
	
	var canvas = canvas;
	var t = targetVert;
	var color = color;
	var edgeCount = 0;
	var sourcesToEdges = {};
	
	this.removeEdge = function(source) {
		delete sourcesToEdges[source];
		edgeCount--;
	}
	
	this.addEdge = function(edge) {
		if (edge.getColor() != color)
			return;
	
		if (edge.getV1().getID() == targetVert.getID()) {
			sourcesToEdges[edge.getV2().getID()] = edge;
			edgeCount++;
		} else if (edge.getV2().getID() == targetVert.getID()) {
			sourcesToEdges[edge.getV1().getID()] = edge;
			edgeCount++;
		}
	}
	
	this.hasEdge = function(source) {
		return source in sourcesToEdges;
	}
	
	this.edgeCount = function() {
		return edgeCount;
	}
	
	this.getSourcesToEdges = function() {
		return sourcesToEdges;
	}
	
	this.draw = function(context, windowLeft, windowTop) {
		// FIXME: Would be nice to clean this up using linear algebra library
		/* Possibly implement this later... right now it doesn't seem like an improvement
		var x_t = targetVert.getX()-windowLeft;
		var y_t = targetVert.getY()-windowTop;
	
		// Compute mean of vectors from target to sources
		var d_m = 0;
		var theta_m = 0;
		for (var s in sourcesToEdges) {
			var x_s = getSourcePosX(s)-windowLeft;
			var y_s = getSourcePosY(s)-windowTop;
			var slope = (y_s-y_t)/(x_s-x_t);
			d_m += Math.sqrt(Math.pow(x_s-x_t,2.0)+Math.pow(y_s-y_t,2.0));
			if (x_s == x_t) {
				theta_m += (y_s > y_t) ? Math.PI/2.0 : -Math.PI/2.0;
			} else if (x_s >= x_t) {
				theta_m += Math.atan(slope);
			} else {
				theta_m += Math.PI + Math.atan(slope);
			}
		}
		d_m /= edgeCount;
		theta_m /= edgeCount;
	
		var x_m = d_m*Math.cos(theta_m);
		var y_m = d_m*Math.sin(theta_m);
		
		// Bezier points common to all edges
		var x_b3 = x_t + x_m/BEZIER_MEAN_DIVISOR;
		var y_b3 = y_t + y_m/BEZIER_MEAN_DIVISOR;
		var x_b2 = x_b3 + (x_t+x_m-x_b3)/1.8;
		var y_b2 = y_b3 + (y_t+y_m-y_b3)/1.8;

		// Draw each edge curve
		context.beginPath();
		for (var s in sourcesToEdges) {
			// Source and bezier points
			var x_s = getSourcePosX(s)-windowLeft;
			var y_s = getSourcePosY(s)-windowTop;
			var x_b0 = x_s + (x_t+x_m-x_s)/BEZIER_MEAN_DIVISOR;
			var y_b0 = y_s + (y_t+y_m-y_s)/BEZIER_MEAN_DIVISOR;
			var x_b1 = x_b0 + (x_t+x_m-x_b0)/1.8;
			var y_b1 = y_b0 + (y_t+y_m-y_b0)/1.8;

			context.moveTo(x_s,y_s);
			context.lineTo(x_b0,y_b0);
			context.bezierCurveTo(x_b1,y_b1,x_b2,y_b2,x_b3,y_b3);			
		}
		
		// Line from curve to target
		context.moveTo(x_b3,y_b3);
		context.lineTo(x_t,y_t);
		
		// Stroke edge curves
		context.strokeStyle = color;
		context.stroke();
		context.closePath();*/
	}
	
	function getSourcePosX(s) {
		var edge = sourcesToEdges[s];
		if (edge.getV1().getID() == targetVert.getID()) {
			return edge.getV2().getX();
		} else {
			return edge.getV1().getX();
		}
	}
	
	function getSourcePosY(s) {
		var edge = sourcesToEdges[s];
		if (edge.getV1().getID() == targetVert.getID()) {
			return edge.getV2().getY();
		} else {
			return edge.getV1().getY();
		}
	}
}