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
function VisualVertex(canvas, overlayCanvas, id, label, colors, fullVisibleWindow, windowLeft, windowTop, x, y, radius) { 
	var EPSILON = .001;
	var DEFAULT_RADIUS = 9;
	var DEFAULT_COLOR = "#FFFFFF";
	var SELECTED_COLOR = "#00FFFF";
	var EMPHASIZED_RADIUS_MULTIPLIER = 1.5;
	var LABEL_OPACITY_MINIMUM = .2;
	var LABEL_OPACITY_NOT_EMPHASIZED = .2;
	var LABEL_OPACITY_EMPHASIZED_DELTA = .05;
	var LABEL_OPACITY_NOT_EMPHASIZED_DELTA = .0001;
	var ID_HIGHLIGHT_COLOR = "#FFFF00";
	var ID_X_OFFSET = 1;
	var ID_Y_OFFSET = -6;
	var LABEL_X_OFFSET = 1;
	var LABEL_Y_OFFSET = 15;
	var FONT = "12pt Calibri";
	var SELECTED_FONT = "bold 12pt Calibri";
	var CHAR_WIDTH = 6;

	var canvas = canvas;
	var overlayCanvas = overlayCanvas;
	var numID = id;
	var id = numID.toString() + '.';
	var label = (label) ? label : '';
	var colors = colors;
	var radius = radius;
	var currentLabelOpacity = 0;//LABEL_OPACITY_NOT_EMPHASIZED;
	
	var x = x;
	var y = y;
	
	if (!x) 
		x = Math.random()*fullVisibleWindow.width + fullVisibleWindow.left + windowLeft;
	if (!y)
		y = Math.random()*fullVisibleWindow.height + fullVisibleWindow.top + windowTop;  
	
	var idHighlightIndex = -1;
	var selected = false;
	var emphasized = false;
	
	var goalX = undefined;
	var goalY = undefined;
	
	var labelVisible = true;
	
	if (!radius)
		radius = DEFAULT_RADIUS;
	
	if (!colors)
		colors = [DEFAULT_COLOR];

	this.setPos = function(newX,newY) {
		x = newX;
		y = newY;
	}
	
	this.setGoalPos = function(newGoalX, newGoalY) {
		goalX = newGoalX;
		goalY = newGoalY;
	}
	
	this.setLabelVisible = function(newLabelVisible) {
		labelVisible = newLabelVisible;
	}

	this.setColors = function(newColors) {
		colors = newColors;
	}
	
	this.setLabel = function(newLabel) {
		/*if (!newLabel)
			return;
		*/
		label = newLabel;
	}
	
	this.setIdHighlightIndex = function(newIdHighlightIndex) {
		idHighlightIndex = newIdHighlightIndex;
	}

	this.setRadius = function(newRadius) {
		radius = newRadius;
	}
	
	this.getFirstColor = function() {
		return colors[0];
	}
	
	this.getX = function() {
		return x;
	}

	this.getY = function() {
		return y;
	}
	
	this.getGoalX = function() {
		return goalX;
	}

	this.getGoalY = function() {
		return goalY;
	}
	
	this.getRadius = function() {
		return radius;
	}
	
	this.getLabel = function() {
		return label;
	}
	
	this.getID = function() {
		return numID;
	}
	
	this.getIDStr = function() {
		return id;
	}
	
	this.inFullVisibleWindow = function(fullVisibleWindow, windowLeft, windowTop) {
		return x >= fullVisibleWindow.left + windowLeft && x <= fullVisibleWindow.left + fullVisibleWindow.width + windowLeft
			&& y >= fullVisibleWindow.top + windowTop && y <= fullVisibleWindow.top + fullVisibleWindow.height + windowTop;
	}
	
	this.toggleSelected = function() {
		idHighlightIndex = -1;
		if (selected) {
			selected = false;
			this.setEmphasized(false);
		} else {
			this.setEmphasized(true);
			selected = true;
		}
	}
	
	this.isSelected = function() {
		return selected;
	}
	
	this.setEmphasized = function(newEmphasized) {
		if (!selected)
			emphasized = newEmphasized;
	}
	
	this.atPos = function(posX, posY, windowLeft, windowTop) {
		return Math.sqrt(Math.pow(posX-this.getX()+windowLeft,2)+Math.pow(posY-this.getY()+windowTop,2))<= this.getRadius(); 		
	}
	
	this.animationNextFrame = function() {
		if (!emphasized) {
			if (currentLabelOpacity > LABEL_OPACITY_NOT_EMPHASIZED)
				currentLabelOpacity -= LABEL_OPACITY_EMPHASIZED_DELTA;
			else if (currentLabelOpacity > LABEL_OPACITY_MINIMUM)
				currentLabelOpacity -= LABEL_OPACITY_NOT_EMPHASIZED_DELTA;
		} else if (emphasized && currentLabelOpacity < 1) {
			currentLabelOpacity += LABEL_OPACITY_EMPHASIZED_DELTA;
		}
	}
	
	this.draw = function(context, overlayContext, fullVisibleWindow, windowLeft, windowTop) {
		drawX = x - windowLeft;
		drawY = y - windowTop;
		
		for (i = 0; i < colors.length; i++) {
			var colorRadius = radius-i*radius/colors.length;
			if (emphasized)
				colorRadius *= EMPHASIZED_RADIUS_MULTIPLIER;
			
			context.beginPath();
			context.arc(drawX, drawY, colorRadius, 0, 2 * Math.PI, false);
			context.fillStyle = colors[i];
			context.fill();
			context.lineWidth = 1;
			context.strokeStyle = colors[i];
			context.stroke();
			context.closePath();
		}
		
		if (this.inFullVisibleWindow(fullVisibleWindow, windowLeft, windowTop)) {
			if (labelVisible && currentLabelOpacity > EPSILON) {
				overlayContext.beginPath();
				overlayContext.font = FONT;
				overlayContext.strokeStyle = "#000000";
				overlayContext.lineWidth = 5;
				overlayContext.fillStyle = DEFAULT_COLOR;
				overlayContext.globalAlpha = currentLabelOpacity;
				overlayContext.strokeText(label, drawX-CHAR_WIDTH*label.length/2.0+LABEL_X_OFFSET, drawY+radius+LABEL_Y_OFFSET);
				overlayContext.fillText(label, drawX-CHAR_WIDTH*label.length/2.0+LABEL_X_OFFSET, drawY+radius+LABEL_Y_OFFSET);
				overlayContext.globalAlpha = 1;
				overlayContext.closePath();
			}

			context.beginPath();
			context.font = FONT;
			context.fillStyle = DEFAULT_COLOR;
			/* HACK: Don't show vertex id for now
			if (idHighlightIndex >= 0 && !selected) {
				context.fillStyle = ID_HIGHLIGHT_COLOR;
				context.fillText(id.substring(0,idHighlightIndex+1), drawX-CHAR_WIDTH*id.length/2.0+ID_X_OFFSET, drawY-radius+ID_Y_OFFSET);
				
				context.fillStyle = DEFAULT_COLOR;
				context.fillText(id.substring(idHighlightIndex+1,id.length), drawX-CHAR_WIDTH*id.length/2.0+ID_X_OFFSET+(idHighlightIndex+1)*CHAR_WIDTH, drawY-radius+ID_Y_OFFSET);
			} else {
				context.font = (selected) ? SELECTED_FONT : FONT;
				context.fillStyle = (selected) ? SELECTED_COLOR : DEFAULT_COLOR;
				context.fillText(id, drawX-CHAR_WIDTH*id.length/2.0+ID_X_OFFSET, drawY-radius+ID_Y_OFFSET);
			}
			*/

			context.closePath();
		}
	} 
}
