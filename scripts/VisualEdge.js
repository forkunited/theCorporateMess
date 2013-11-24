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
function VisualEdge(canvas, v1, v2, color, direction) {	
	var that = this;

	var DEFAULT_COLOR = "#FFFFFF";
	var DEFAULT_EDGE_DIR = VisualEdge.EDGE_DIR_FORWARD;
	var DEFAULT_THICKNESS = 2;
	var EMPHASIZED_THICKNESS = 4;
	var TRIANGLE_LENGTH = 10;
	var AT_POS_MAX_THETA = .3;
	
	var canvas = canvas;
	var v1 = v1;
	var v2 = v2;
	var color = color;
	var direction = direction;
	var type = VisualEdge.EDGE_TYPE_NORMAL;
	var thickness = DEFAULT_THICKNESS;
	var focusable = true;
	
	if (!color)
		color = DEFAULT_COLOR;
	
	if (!direction)
		direction = DEFAULT_EDGE_DIR;
	
	this.swapDirection = function() {
		if (direction == VisualEdge.EDGE_DIR_FORWARD) {
			direction = VisualEdge.EDGE_DIR_BACKWARD;
		} else if (direction == VisualEdge.EDGE_DIR_BACKWARD) {
			direction = VisualEdge.EDGE_DIR_FORWARD;
		}
	}
	
	this.setEdgeType = function(newType) {
		type = newType;
	}
	
	this.setEdgeDirection = function(newDirection) {
		direction = newDirection;
	}
	
	this.setColor = function(newColor) {
		color = newColor;
	}
	
	this.setThickness = function(newThickness) {
		thickness = newThickness;
	}
	
	this.setEmphasized = function(emphasized) {
		if (emphasized)
			that.setThickness(EMPHASIZED_THICKNESS);
		else
			that.setThickness(DEFAULT_THICKNESS);
	}
	
	this.setFocusable = function(newFocusable) {
		focusable = newFocusable;
	}
	
	this.getFocusable = function() {
		return focusable;
	}
	
	this.getColor = function() {
		return color;
	}
	
	this.getEdgeDirection = function() {
		return direction;
	}
	
	this.getEdgeType = function() {
		return type;
	}
	
	this.getThickness = function() {
		return thickness;
	}
	
	this.getV1 = function() {
		return v1;
	}

	this.getV2 = function() {
		return v2;
	}
	
	this.getCenterX = function() {
		return (v1.getX() + v2.getX())/2.0;
	}
	
	this.getCenterY = function() {
		return (v1.getY() + v2.getY())/2.0;
	}
	
	this.atPos = function(posX, posY, windowLeft, windowTop) {
		var thisX1 = v1.getX() - windowLeft;
		var thisY1 = v1.getY() - windowTop;
		var thisX2 = v2.getX() - windowLeft;
		var thisY2 = v2.getY() - windowTop;
		
		var v1pX = posX - thisX1;
		var v1pY = posY - thisY1;
		var v1pMag = Math.sqrt(Math.pow(v1pX, 2)+Math.pow(v1pY,2));
		var v12X = thisX2 - thisX1;
		var v12Y = thisY2 - thisY1;
		var v12Mag = Math.sqrt(Math.pow(v12X, 2)+Math.pow(v12Y,2));
		var v2pX = posX - thisX2;
		var v2pY = posY - thisY2;
		var v2pMag = Math.sqrt(Math.pow(v2pX, 2)+Math.pow(v2pY,2));
		
		if (v1pMag <= v1.getRadius() || v2pMag <= v2.getRadius() || v12Mag <= v1pMag)
			return false;
		
		var theta = Math.acos((v1pX*v12X+v1pY*v12Y)/(v1pMag*v12Mag));
		if (theta >= AT_POS_MAX_THETA)
			return false;
		
		return true;	
	}
	
	this.draw = function(context, windowLeft, windowTop) {
		// Draw arrow
		// (x_0,y_0) is from point
		// (x_1,y_1) is to point
		if (direction == VisualEdge.EDGE_DIR_FORWARD) {
			var x_0 = v1.getX() - windowLeft;
			var y_0 = v1.getY() - windowTop;
			var x_1 = v2.getX() - windowLeft;
			var y_1 = v2.getY() - windowTop;
			var r = v2.getRadius();
		} else {
			var x_0 = v2.getX() - windowLeft;
			var y_0 = v2.getY() - windowTop;
			var x_1 = v1.getX() - windowLeft;
			var y_1 = v1.getY() - windowTop;							
			var r = v1.getRadius();
		}
		
		// Slope, distance and angle of arrow line
		var m = (y_1-y_0)/(x_1-x_0);
		var d = Math.sqrt(Math.pow(y_1-y_0, 2)+Math.pow(x_1-x_0, 2));
		var theta = Math.atan(m);
		
		// Directly triangle length and height
		var l = TRIANGLE_LENGTH;
		var h = (Math.sqrt(3)/2.0)*l;
		
		if (x_1 >= x_0) {
			var sign = 1;
		} else {
			var sign = -1;
		}
		
		/* Draw main edge line */
		context.beginPath();
		context.moveTo(x_0,y_0);
		
		if (type != VisualEdge.EDGE_TYPE_SQUIGGLE) {
			context.lineTo(x_1, y_1);
		} else {
			/* Draw squiggle */	
			var d_prime = d - 2*r;
			var x_s1 = x_0+sign*(r+d_prime/10)*Math.cos(theta);
			var y_s1 = y_0+sign*(r+d_prime/10)*Math.sin(theta);
			var x_s2 = x_0+sign*(r+d_prime/2)*Math.cos(theta);
			var y_s2 = y_0+sign*(r+d_prime/2)*Math.sin(theta);
			var x_s3 = x_0+sign*(r+d_prime/2+(d_prime/2-h)/2)*Math.cos(theta);
			var y_s3 = y_0+sign*(r+d_prime/2+(d_prime/2-h)/2)*Math.sin(theta);
			var x_s4 = x_0+sign*(r+d_prime-h)*Math.cos(theta);
			var y_s4 = y_0+sign*(r+d_prime-h)*Math.sin(theta);
			
			context.moveTo(x_s1,y_s1);
			context.lineTo(x_s2,y_s2);
			
			context.moveTo(x_s4,y_s4);
			context.lineTo(x_1,y_1);
			if (d_prime/2-h > 0) {
				if (sign > 0) 
					context.arc(x_s3, y_s3, (d_prime/2-h)/2, theta, Math.PI+theta, false);
				else 
					context.arc(x_s3, y_s3, (d_prime/2-h)/2, Math.PI+theta, theta, false);	
			}
		}
		context.lineWidth = thickness;
		context.strokeStyle = color;
		context.stroke();
		context.closePath();
		
		if (type == VisualEdge.EDGE_TYPE_X) {
			/* Draw X */
			var x_m1 = x_0 + sign*(2*d/5)*Math.cos(theta);
			var y_m1 = y_0 + sign*(2*d/5)*Math.sin(theta);
			var x_m2 = x_0 + sign*(3*d/5)*Math.cos(theta);
			var y_m2 = y_0 + sign*(3*d/5)*Math.sin(theta);
			
			// First X point
			var x_x1 = x_m1 + (l/2.0)*Math.sin(theta);
			var y_x1 = y_m1 - (l/2.0)*Math.cos(theta);
		
			// Second X point
			var x_x2 = x_m1 - (l/2.0)*Math.sin(theta);
			var y_x2 = y_m1 + (l/2.0)*Math.cos(theta);

			// Third X point
			var x_x3 = x_m2 + (l/2.0)*Math.sin(theta);
			var y_x3 = y_m2 - (l/2.0)*Math.cos(theta);
		
			// Fourth X point
			var x_x4 = x_m2 - (l/2.0)*Math.sin(theta);
			var y_x4 = y_m2 + (l/2.0)*Math.cos(theta);
			
			context.beginPath();
			
			context.moveTo(x_x1,y_x1);
			context.lineTo(x_x4,y_x4);				

			context.moveTo(x_x2,y_x2);
			context.lineTo(x_x3,y_x3);	
			
			context.lineWidth = thickness;
			context.strokeStyle = color;
			context.stroke();
			
			context.closePath();
		}
		
		/* Draw direction... maybe? */
		if (direction == VisualEdge.EDGE_DIR_BOTH)
			return;
		
		// Point at the center of the base of the triangle
		var x_b = x_0 + sign*(d-(h+r))*Math.cos(theta);
		var y_b = y_0 + sign*(d-(h+r))*Math.sin(theta);
		
		// Angle of triangle base
		var omega = Math.PI/2.0-theta;
		
		// Zeroth triangle point
		var x_t0 = x_0 + sign*(d-r)*Math.cos(theta);
		var y_t0 = y_0 + sign*(d-r)*Math.sin(theta);
		
		// First triangle point
		var x_t1 = x_b + (l/2.0)*Math.sin(theta);
		var y_t1 = y_b - (l/2.0)*Math.cos(theta);
		
		// Second triangle point
		var x_t2 = x_b - (l/2.0)*Math.sin(theta);
		var y_t2 = y_b + (l/2.0)*Math.cos(theta);
		
		context.beginPath();
		context.moveTo(x_t0,y_t0); 
		context.lineTo(x_t1,y_t1); 
		context.lineTo(x_t2, y_t2);
		context.lineTo(x_t0, y_t0);
		
		context.lineWidth = thickness;
		context.strokeStyle = color;
		context.fillStyle = color;
		context.fill();
		context.stroke();
		context.closePath();
	}
}

/* Edge directions */
VisualEdge.EDGE_DIR_FORWARD = 0;
VisualEdge.EDGE_DIR_BACKWARD = 1;
VisualEdge.EDGE_DIR_BOTH = 2;

/* Edge types */
VisualEdge.EDGE_TYPE_NORMAL = 0;
VisualEdge.EDGE_TYPE_X = 1;
VisualEdge.EDGE_TYPE_SQUIGGLE = 2;