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
function VisualSelection(canvas, anchorX, anchorY) { 
	var EPSILON = .001;
	var COLOR = "#555555";
	var OPACITY = .4;

	var cornerX = anchorX;
	var cornerY = anchorY;
	
	var visible = false;
	
	this.setCornerPos = function(newCornerX, newCornerY) {
		cornerX = newCornerX;
		cornerY = newCornerY;
	}
	
	this.setAnchorPos = function(newAnchorX, newAnchorY) {
		anchorX = newAnchorX;
		anchorY = newAnchorY;
	}
	
	this.setVisible = function(newVisible) {
		visible = newVisible;
	}
	
	this.isVisible = function() {
		return visible;
	}
	
	this.containsPos = function(posX, posY) {
		var left = Math.min(cornerX, anchorX);
		var right = Math.max(cornerX, anchorX);
		var top = Math.min(cornerY, anchorY);
		var bottom = Math.max(cornerY, anchorY);
		
		return posX >= left && posX <= right && posY >= top && posY <= bottom;
	}
	
	this.draw = function(context, windowLeft, windowTop) {
		if (!visible)
			return;
		
		var topLeftX = Math.min(anchorX, cornerX) - windowLeft;
		var topLeftY = Math.min(anchorY, cornerY) - windowTop;
		var width = Math.abs(cornerX - anchorX);
		var height = Math.abs(cornerY - anchorY);

		context.beginPath();

		context.fillStyle = COLOR;
		context.globalAlpha = OPACITY;
		context.fillRect(topLeftX, topLeftY, width, height);

		context.strokeStyle = COLOR;
		context.lineWidth = 1;		
		context.globalAlpha = 1;
		context.strokeRect(topLeftX, topLeftY, width, height);

		context.closePath();
	} 
}
