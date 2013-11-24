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
function RetrieveMessGraph() {
	var that = this; 
	
	var QUERY_TYPE_GRAPH_ALL_BY_TAGS = "graphAllByTags";
	var QUERY_TYPE_TAGS_ALL_BY_USER = "tagsAllByUser";
	var QUERY_TYPE_TAGS_RECENTLY_UPDATED = "tagsRecentlyUpdated";
	var QUERY_TYPE_TAGS_SEARCH_BY_USER = "tagsSearchByUser";
	var QUERY_TYPE_TAGS_SEARCH = "tagsSearch";
	
	this.RETRIEVE_SCRIPT = 'server/retrieveMessGraph.php';
	
	this.graphAllByTags = function(fnRetrieved, tags) {
		var tagIds = [];
		var minUpdatedDates = [];
		var compactionDates = [];
		
		for (var i in tags) {
			tagIds.push(tags[i].id);
			minUpdatedDates.push(tags[i].updatedDate);
			compactionDates.push(tags[i].compactionDate);
		}
	
	
		Util.sendJSONPostRequest(
								this.RETRIEVE_SCRIPT,
								fnRetrieved,
								"message=" + JSON.stringify(
									StorageMessage.makeRequestRetrieveMessGraph(
										QUERY_TYPE_GRAPH_ALL_BY_TAGS,
										{
											tagIds : tagIds, 
											minUpdatedDates : minUpdatedDates,
											compactionDates : compactionDates
										}
									)
								)
		);
	}
	
	this.tagsAllByUser = function(fnRetrieved, user, skip, limit) {
		Util.sendJSONPostRequest(
								this.RETRIEVE_SCRIPT,
								fnRetrieved,
								"message=" + JSON.stringify(
									StorageMessage.makeRequestRetrieveMessGraph(
										QUERY_TYPE_TAGS_ALL_BY_USER,
										{
											user : user, 
											skip : skip,
											limit : limit
										} 
									)
								)
		);
	}
	
	this.tagsRecentlyUpdated = function(fnRetrieved, skip, limit) {
		Util.sendJSONPostRequest(
								this.RETRIEVE_SCRIPT,
								fnRetrieved,
								"message=" + JSON.stringify(
									StorageMessage.makeRequestRetrieveMessGraph(
										QUERY_TYPE_TAGS_RECENTLY_UPDATED,
										{ 
											skip : skip,
											limit : limit
										}
									) 
								)
		);
	}
	
	this.tagsSearchByUser = function(fnRetrieved, user, search, skips, limit) {
		Util.sendJSONPostRequest(
								this.RETRIEVE_SCRIPT,
								fnRetrieved,
								"message=" + JSON.stringify(
									StorageMessage.makeRequestRetrieveMessGraph(
										QUERY_TYPE_TAGS_SEARCH_BY_USER,
										{ 
											user : user,
											search : search,
											skips : skips,
											limit : limit
										}
									) 
								)
		);
	}
	
	this.tagsSearch = function(fnRetrieved, search, skips, limit) {
		Util.sendJSONPostRequest(
								this.RETRIEVE_SCRIPT,
								fnRetrieved,
								"message=" + JSON.stringify(
									StorageMessage.makeRequestRetrieveMessGraph(
										QUERY_TYPE_TAGS_SEARCH,
										{ 
											search : search,
											skips : skips,
											limit : limit
										}
									) 
								)
		);
	}
}
