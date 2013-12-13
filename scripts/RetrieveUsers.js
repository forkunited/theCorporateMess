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
function RetrieveUsers() {
	var that = this; 

	this.QUERY_TYPE_ACCESS_TO_TAG = "accessToTag";
	this.QUERY_TYPE_ALL = "all";
	
	this.RETRIEVE_SCRIPT = 'server/retrieveUsers.php';
	
	this.accessToTag = function(fnRetrieved, tag) {
		Util.sendJSONPostRequest(
								this.RETRIEVE_SCRIPT,
								fnRetrieved,
								"message=" + JSON.stringify(
									StorageMessage.makeRequestRetrieveUsers(
										that.QUERY_TYPE_ACCESS_TO_TAG,
										{tagId : tag.id}
									)
								)
		);
	}
	
	this.all = function(fnRetrieved) {
		Util.sendJSONPostRequest(
							this.RETRIEVE_SCRIPT,
							fnRetrieved,
							"message=" + JSON.stringify(
								StorageMessage.makeRequestRetrieveUsers(
									that.QUERY_TYPE_ALL,
									{}
								)
							)
		);
	}
}
