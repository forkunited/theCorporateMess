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

function Util() {}

Util.error = undefined;

Util.currentTime = function() {
	return Math.round((new Date()).getTime() / 1000);
}

Util.currentTimeInMillis = function() {
	return Math.round((new Date()).getTime());
}

Util.constructRequest = function() {
	var xmlhttp = undefined;

	if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	} else {// code for IE6, IE5
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	return xmlhttp;
}

Util.sendJSONPostRequest = function(loc, responseHandle, content) {
	var req = Util.constructRequest();
	req.onreadystatechange=function() {
		if (req.readyState==4 && req.status==200) {
			try {
				responseHandle(JSON.parse(req.responseText));
			} catch (e) {
				Util.error = e + ' Response: ' + req.responseText;
			}
		} else if (req.readyState == 4 && req.status != 200) {
			Util.error = req.responseText;
		}
	}	
	req.open("POST", loc, true);
	req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	req.send(content);
}