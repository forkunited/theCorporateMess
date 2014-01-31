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
function RandomColors() {}

RandomColors.maxHistoryLength = 8;

RandomColors.minColorSeparation = 30;

RandomColors.historyR = [];
RandomColors.historyG = [];
RandomColors.historyB = [];

RandomColors.next = function() {
	var h = Math.random();
	var s = 1;//Math.random()*.7+.2;
	var v = .45;//.99;
	
	var h_i = Math.floor(h*6);
	var f = h*6 - h_i;
	var p = v * (1 - s);
	var q = v * (1 - f*s);
	var t = v * (1 - (1 - f) * s);
	var r = 0;
	var g = 0;
	var b = 0;
	
	if (h_i == 0) {
		r = v;
		g = t;
		b = p;
	} else if (h_i == 1) {
		r = q;
		g = v;
		b = p;
	} else if (h_i == 2) {
		r = p;
		g = v;
		b = t;
	} else if (h_i == 3) {
		r = p;
		g = q;
		b = v;
	} else if (h_i == 4) {
		r = t;
		g = p;
		b = v;
	} else if (h_i == 5) {
		r = v;
		g = p;
		b = q;
	}
	
	r = Math.floor(r*256);
	g = Math.floor(g*256);
	b = Math.floor(b*256);
	
	for (var i in RandomColors.historyG) {
		var dist = Math.sqrt(Math.pow(r-RandomColors.historyR[i],2)+Math.pow(g-RandomColors.historyG[i],2)+Math.pow(b-RandomColors.historyB[i],2));
		if (dist < RandomColors.minColorSeparation) {
			return RandomColors.next();
		}
	}

	if (RandomColors.historyR.length > RandomColors.maxHistoryLength) {
		RandomColors.historyR.shift();
		RandomColors.historyG.shift();
		RandomColors.historyB.shift();
	}
	
	RandomColors.historyR.push(r);
	RandomColors.historyG.push(g);
	RandomColors.historyB.push(b);
	
	return '#' + r.toString(16) + g.toString(16) + b.toString(16);
}
