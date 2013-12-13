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
function TagSearchMenu(container, editContainer, currentUser, messStore) {
	var that = this;  
	
	this.DOM_OPTIONS_CLASS = 'tagSearchMenuOptions';
	this.DOM_FILTER_CLASS = 'tagSearchMenuFilter';
	this.DOM_SEARCH_CLASS = 'tagSearchMenuSearch';
	this.DOM_FILTER_TEXT_CLASS = 'tagSearchMenuFilterText';
	this.DOM_FILTER_SELECT_CLASS = 'tagSearchMenuFilterInput';
	this.DOM_SEARCH_INPUT_CLASS = 'tagSearchMenuSearchInput';
	this.DOM_SEARCH_SUBMIT_CLASS = 'tagSearchMenuSearchSubmit';
	this.DOM_LIST_CLASS = 'tagSearchMenuList';
	this.DOM_LIST_EMPTY_CLASS = 'tagSearchMenuListEmpty';
	this.DOM_LIST_LOADING_CLASS = 'tagSearchMenuListLoading';
	this.DOM_FOOTER_CLASS = 'tagSearchMenuFooter';
	this.DOM_FOOTER_LEFT_CLASS = 'tagSearchMenuFooterLeft';
	this.DOM_FOOTER_RIGHT_CLASS = 'tagSearchMenuFooterRight';
	this.DOM_CREATE_CLASS = 'tagSearchMenuCreate';
	this.DOM_CREATE_INPUT_CLASS = 'tagSearchMenuCreateInput';
	this.DOM_CREATE_SUBMIT_CLASS = 'tagSearchMenuCreateSubmit';
	this.DOM_TAG_EDIT_MENU_CLASS = 'tagSearchMenuTagEditMenu';
	this.DOM_TAG_EDIT_MENU_HEADER_CLASS = 'tagSearchMenuTagEditMenuHeader';
	this.DOM_TAG_EDIT_MENU_CONTENT_CLASS = 'tagSearchMenuTagEditMenuContent';
	
	this.FOOTER_STATE_SKIP = 'skip';
	this.FOOTER_STATE_CREATE = 'create';
	this.FOOTER_STATE_NONE = 'none';
	
	this.FILTER_STATE_SELECTED = 'Selected';
	this.FILTER_STATE_YOURS = 'Yours';
	this.FILTER_STATE_ALL = 'All';
	
	this.LIST_STATE_CREATING = 'creating';
	this.LIST_STATE_LOADING = 'loading';
	this.LIST_STATE_READY = 'ready';
	
	this.DEFAULT_FILTER_STATE = "FULL";
	this.LIST_DISPLAY_LIMIT = 10;
	this.CREATE_TAG_TEMP_ID = "tagSearchMenuTempId";
	this.SELECT_TAG_TEMP_ID_PREFIX = "selecting_";
	
	/* Elements */
	var optionsElement = document.createElement('div');
	var filterElement = document.createElement('div');
	var searchElement = document.createElement('div');
	var filterTextElement = document.createElement('div');
	var filterSelectElement = document.createElement('select');
	var searchInputElement = document.createElement('input');
	var searchSubmitElement = document.createElement('input');
	var listElement = document.createElement('div');
	var listEmptyElement = document.createElement('div');
	var listLoadingElement = document.createElement('div');
	var footerElement = document.createElement('div');
	var footerLeftElement = document.createElement('div');
	var footerRightElement = document.createElement('div');
	var createElement = document.createElement('div');
	var createInputElement = document.createElement('input');
	var createSubmitElement = document.createElement('input');
	var filterSelectOptionSelectedElement = document.createElement('option');
	var filterSelectOptionYoursElement = document.createElement('option');
	var filterSelectOptionAllElement = document.createElement('option');
	var tagEditMenuElement = document.createElement('div');
	var tagEditMenuHeaderElement = document.createElement('div');
	var tagEditMenuContentElement = document.createElement('div');
	
	/* Maps filter values (selected, yours, all... etc)
	 * to objects containing: 
	 *  - items     (list of cached items)
	 *  - skips     (lists of counts of results already skipped)
	 *  - remainder (indicates whether there are remaining results to retrieve)
	 *  - search    (search terms)
	 *  - listState (loading, ready... etc)
	 */
	var filterData = {};
	var filterState = that.DEFAULT_FILTER_STATE;
	var filterUser = undefined;
	var footerState = that.FOOTER_STATE_NONE;
	var searching = false;
	var filteringByYear = false;
	
	var retrieve = new RetrieveMessGraph();
	var retrieveUsers = new RetrieveUsers();
	var tagEditMenu = new TagEditMenu(tagEditMenuContentElement, currentUser, messStore);
	
	removeContainerChildren();
	constructInterfaceElements();
	messStore.addLocalMessageHandler(storeMessageHandler);
	filterSelectChangeHandler();
	
	function constructInterfaceElements() {
		/* Set Attributes */
		optionsElement.setAttribute('class', that.DOM_OPTIONS_CLASS);
		filterElement.setAttribute('class', that.DOM_FILTER_CLASS);
		searchElement.setAttribute('class', that.DOM_SEARCH_CLASS);
		filterTextElement.setAttribute('class', that.DOM_FILTER_TEXT_CLASS);
		filterSelectElement.setAttribute('class', that.DOM_FILTER_SELECT_CLASS);
		searchInputElement.setAttribute('class', that.DOM_SEARCH_INPUT_CLASS);	
		searchSubmitElement.setAttribute('class', that.DOM_SEARCH_SUBMIT_CLASS);	
		listElement.setAttribute('class', that.DOM_LIST_CLASS);	
		listEmptyElement.setAttribute('class', that.DOM_LIST_EMPTY_CLASS);
		listLoadingElement.setAttribute('class', that.DOM_LIST_LOADING_CLASS);
		footerElement.setAttribute('class', that.DOM_FOOTER_CLASS);	
		footerLeftElement.setAttribute('class', that.DOM_FOOTER_LEFT_CLASS);
		footerRightElement.setAttribute('class', that.DOM_FOOTER_RIGHT_CLASS);
		createElement.setAttribute('class', that.DOM_CREATE_CLASS);
		createInputElement.setAttribute('class', that.DOM_CREATE_INPUT_CLASS);
		createSubmitElement.setAttribute('class', that.DOM_CREATE_SUBMIT_CLASS);
		tagEditMenuElement.setAttribute('class', that.DOM_TAG_EDIT_MENU_CLASS);
		tagEditMenuHeaderElement.setAttribute('class', that.DOM_TAG_EDIT_MENU_HEADER_CLASS);
		tagEditMenuContentElement.setAttribute('class', that.DOM_TAG_EDIT_MENU_CONTENT_CLASS);
		
		searchInputElement.setAttribute('type', 'text');
		searchSubmitElement.setAttribute('type', 'submit');
		createInputElement.setAttribute('type', 'text');
		createSubmitElement.setAttribute('type', 'submit');
		
		searchSubmitElement.setAttribute('value', 'Search');
		createSubmitElement.setAttribute('value', 'Create');
		
		filterSelectOptionSelectedElement.setAttribute('value', that.FILTER_STATE_SELECTED);
		filterSelectOptionYoursElement.setAttribute('value', that.FILTER_STATE_YOURS);
		filterSelectOptionAllElement.setAttribute('value', that.FILTER_STATE_ALL);
		filterSelectOptionSelectedElement.innerHTML = that.FILTER_STATE_SELECTED;
		filterSelectOptionYoursElement.innerHTML = that.FILTER_STATE_YOURS;
		filterSelectOptionAllElement.innerHTML = that.FILTER_STATE_ALL;
		
		/* Set up hierarchy */
		container.appendChild(optionsElement);
		container.appendChild(listElement);
		container.appendChild(footerElement);
		optionsElement.appendChild(filterElement);
		optionsElement.appendChild(searchElement);
		filterElement.appendChild(filterTextElement);
		filterElement.appendChild(filterSelectElement);
		searchElement.appendChild(searchInputElement);
		searchElement.appendChild(searchSubmitElement);
		createElement.appendChild(createInputElement);
		createElement.appendChild(createSubmitElement);
		/*filterSelectElement.appendChild(filterSelectOptionSelectedElement);
		filterSelectElement.appendChild(filterSelectOptionYoursElement);
		filterSelectElement.appendChild(filterSelectOptionAllElement); HACK: Don't put these there... put users (years) from server there instead */
		editContainer.appendChild(tagEditMenuElement);
		tagEditMenuElement.appendChild(tagEditMenuHeaderElement);
		tagEditMenuElement.appendChild(tagEditMenuContentElement);
	
		/* Set interactivity */
		filterSelectElement.onchange = filterSelectChangeHandler;
		searchSubmitElement.onclick = searchSubmitClickHandler;
		createSubmitElement.onclick = createSubmitClickHandler;
		
		//filterSelectElement.value = that.DEFAULT_FILTER_STATE; HACK ... no
		listLoadingElement.innerHTML = 'Loading...';
		filterTextElement.innerHTML = 'Filter: ';

		closeTagEditMenuLink = document.createElement('a');
		closeTagEditMenuLink.setAttribute("href", "javascript:void(0)");
		closeTagEditMenuLink.innerHTML = '[X]';
		closeTagEditMenuLink.onclick = closeTagEditMenuClickHandler;
		tagEditMenuHeaderElement.appendChild(closeTagEditMenuLink);
		
		/* Add first selected state (maybe move this later) */
		filterData[that.FILTER_STATE_SELECTED] = 
		{
			items : [],
			skips : [[]],
			remainder : false,
			search : "",
			listState : that.LIST_STATE_READY,
			resetOnSelectChange : false
		};
		
		tagEditMenuElement.style.visibility = 'hidden';
	}
	
	function removeContainerChildren() {
		while (container.hasChildNodes()) {
			container.removeChild(container.firstChild);
		}
	}
	
	/* Form handlers */
	
	function filterSelectChangeHandler() {
		filterState = that.FILTER_STATE_YOURS; // HACK: Always filter by user ("yours" is filterUser (year))
		filterUser = filterSelectElement.value;

		var prevState = true;
		if (!(filterState in filterData) || filterData[filterState].resetOnSelectChange) {
			filterData[filterState] = 
			{
				items : [],
				skips : [[]],
				remainder : false,
				search : "",
				listState : that.LIST_STATE_READY,
				resetOnSelectChange : true
			};
			prevState = false;
		} 

		setListState(filterData[filterState].listState);
		searchInputElement.value = filterData[filterState].search;
		
		if (filterState == that.FILTER_STATE_SELECTED) {
			setFooterState(that.FOOTER_STATE_CREATE);
			hideSearch();
		} else {
			setFooterState(that.FOOTER_STATE_SKIP);
			showSearch();
			searchSubmitClickHandler(); // Perform search
			
			// Change selected tag years...
			var selectedIds = messStore.getSelectedTagIds();
			var selectedTagNames = [];
			for (var i = 0; i < selectedIds.length; i++) {
				selectedTagNames.push(messStore.getTag(selectedIds[i]).name);
				messStore.deselectTag(selectedIds[i]);
			}
			if (selectedIds.length > 0) {
				retrieve.tagsByNamesAndUser(filterSelectChangeTagsHandler, filterUser, selectedTagNames);
				filteringByYear = true;
			}
		}
	}
	
	function createSubmitClickHandler() {
		var filterStateData = filterData[filterState];
		filterData[filterState].listState = that.LIST_STATE_CREATING;
		
		if (!messStore.addTag(that.CREATE_TAG_TEMP_ID, createInputElement.value, true)) {
			// FIXME: Handle errors
			return;
		}
		
		filterData[filterState].items.push(new TagSearchMenuItem(
			that, 
			currentUser, 
			messStore, 
			{
				id : that.CREATE_TAG_TEMP_ID,
				name : "Creating " + createInputElement.value + "..."
			}
		));
		
		createInputElement.value = "";
		
		setListState(filterData[filterState].listState);
	}
	
	function searchSubmitClickHandler() {
		var filterStateData = filterData[filterState];
		filterStateData.listState = that.LIST_STATE_LOADING;
		filterStateData.search = searchInputElement.value;
		filterStateData.skips = [[]];
		filterStateData.items = [];
		
		searchHelper(filterState, filterStateData.search, []);
		setListState(filterData[filterState].listState);
	}
	
	function prevLinkClickHandler() {
		var filterStateData = filterData[filterState];
		if (filterStateData.skips.length <= 1)
			return;
		
		filterStateData.skips.pop();
		filterStateData.skips.pop();
		filterStateData.items = [];
		
		filterStateData.listState = that.LIST_STATE_LOADING;
		filterStateData.search = searchInputElement.value;
		searchHelper(filterState, 
					 filterStateData.search, 
					 filterStateData.skips[filterStateData.skips.length - 1]);
		setListState(filterData[filterState].listState);		
	}
	
	function nextLinkClickHandler() {
		var filterStateData = filterData[filterState];
		filterStateData.listState = that.LIST_STATE_LOADING;
		filterStateData.search = searchInputElement.value;
		
		filterStateData.items = [];
		
		searchHelper(filterState, 
					 filterStateData.search, 
					 filterStateData.skips[filterStateData.skips.length - 1]);
		setListState(filterData[filterState].listState);
	}
	
	function searchHelper(state, searchStr, skips) {
		if (!filterUser) {
			retrieveFilterUsers();
			return;
		}
	
		if (state == that.FILTER_STATE_YOURS) {
			if (searchStr.length == 0) {
				retrieve.tagsAllByUser(searchRetrieveHandler,
									   filterUser,
									   skips.length == 0 ? 0 : skips[0],
									   that.LIST_DISPLAY_LIMIT);
			} else {
				retrieve.tagsSearchByUser(searchRetrieveHandler,
										  filterUser,
										  searchStr,
										  skips.length == 0 ? [] : skips,
										  that.LIST_DISPLAY_LIMIT);
			}
			searching = true;
		} else if (state == that.FILTER_STATE_ALL) {
			if (searchStr.length == 0) {
				retrieve.tagsRecentlyUpdated(searchRetrieveHandler,
											 skips.length == 0 ? 0 : skips[0],
											 that.LIST_DISPLAY_LIMIT);
			} else {
				retrieve.tagsSearch(searchRetrieveHandler,
									searchStr,
									skips.length == 0 ? [] : skips,
									that.LIST_DISPLAY_LIMIT);
			}
			searching = true;
		} 
	}
	
	function retrieveFilterUsers() {
		retrieveUsers.all(retrieveFilterUsersHandler);
	}
	
	function closeTagEditMenuClickHandler() {
		tagEditMenu.setTag();
		tagEditMenuElement.style.visibility = 'hidden';
		closeTagEditMenuLink.style.visibility = 'hidden';	
	}
	
	/* Helpers to manipulate interface */
	
	function hideSearch() {
		searchElement.style.display = 'none';
	}
	
	function showSearch() {
		searchElement.style.display = 'inline';
	}
	
	function disableOptions() {
		searchInputElement.disabled = true;
		searchSubmitElement.disabled = true;
		filterSelectElement.disabled = true;
	}
	
	function enableOptions() {
		searchInputElement.disabled = false;
		searchSubmitElement.disabled = false;
		filterSelectElement.disabled = false;
	}
	
	function disableFooter() {
		createInputElement.disabled = true;
		createSubmitElement.disabled = true;
		
		if (footerState == that.FOOTER_STATE_SKIP) {
			footerLeftElement.style.visibility = "hidden";
			footerRightElement.style.visibility = "hidden";
		}
	}
	
	function enableFooter() {
		createInputElement.disabled = false;
		createSubmitElement.disabled = false;
		footerLeftElement.style.visibility = "visible";
		footerRightElement.style.visibility = "visible";
	}
	
	function setListState(listState) {
		filterData[filterState].listState = listState;
		
		while (listElement.hasChildNodes()) {
			listElement.removeChild(listElement.firstChild);
		}
	
		if (listState == that.LIST_STATE_LOADING || listState == that.LIST_STATE_CREATING) {
			disableOptions();
			disableFooter();
			listElement.appendChild(listLoadingElement);
		} else {
			enableOptions();
			enableFooter();
			
			if (filterData[filterState].items.length == 0) {
				if (filterState == that.FILTER_STATE_SELECTED) {
					listEmptyElement.innerHTML = 'No mess selected.  Try changing the filter to "All", and then selecting something from the list that appears.';
				} else if (filterState == that.FILTER_STATE_YOURS) {
					listEmptyElement.innerHTML = 'You haven\'t created anything.  Try changing the filter to "Selected", and creating something new using the input box at the bottom.';
				} else if (filterState == that.FILTER_STATE_ALL) {
					listEmptyElement.innerHTML = 'There is nothing... nothing at all.';
				} else {
					listEmptyElement.innerHTML = '';
				}
				listElement.appendChild(listEmptyElement);
			} else {
				for (var i = 0; i < filterData[filterState].items.length; i++) {
					listElement.appendChild(filterData[filterState].items[i].getElement());
				}
			}
			
			while (footerLeftElement.hasChildNodes()) {
				footerLeftElement.removeChild(footerLeftElement.firstChild);
			}
			
			while (footerRightElement.hasChildNodes()) {
				footerRightElement.removeChild(footerRightElement.firstChild);
			}
			
			if (filterData[filterState].skips.length > 2) {
				var prevLink = document.createElement('a');
				prevLink.setAttribute("href", "javascript:void(0)");
				prevLink.innerHTML = '< Previous';
				prevLink.onclick = prevLinkClickHandler;
				footerLeftElement.appendChild(prevLink);
			}
			
			if (filterData[filterState].remainder) {
				var nextLink = document.createElement('a');
				nextLink.setAttribute("href", "javascript:void(0)");
				nextLink.innerHTML = 'Next >';
				nextLink.onclick = nextLinkClickHandler;
				footerRightElement.appendChild(nextLink);
			}
		}
	}
	
	function setFooterState(newFooterState) {
		footerState = newFooterState;
		
		while (footerElement.hasChildNodes()) {
			footerElement.removeChild(footerElement.firstChild);
		}
	
		if (footerState == that.FOOTER_STATE_SKIP) {
			footerElement.display = 'inline';
			footerElement.appendChild(footerLeftElement);
			footerElement.appendChild(footerRightElement);
		} else if (footerState == that.FOOTER_STATE_CREATE) {
			footerElement.display = 'inline';
			footerElement.appendChild(createElement);
		} else {
			footerElement.display = 'none';
		}
	}
	
	/* Mess store change handler */
	
	function storeMessageHandler(message) {
		// Assumes there is only one TagSearchMenu object in the UI
		if (message.messageType == LocalStorageMessage.SELECT_TAG) {
			var selectingTagId = that.SELECT_TAG_TEMP_ID_PREFIX + message.id;
			if (indexOfTagId(that.FILTER_STATE_SELECTED, selectingTagId) < 0
				&& indexOfTagId(that.FILTER_STATE_SELECTED, message.id) < 0) {
				var selectingItem = new TagSearchMenuItem(
					that, 
					currentUser, 
					messStore, 
					{
						id : selectingTagId,
						name : "Loading a selection..."
					}
				);
				selectingItem.hideSubtext();
				
				filterData[that.FILTER_STATE_SELECTED].items.push(selectingItem);
				if (that.getFilterState() == that.FILTER_STATE_SELECTED) {
					setListState(filterData[that.FILTER_STATE_SELECTED].listState);
				}
				
				selectingItem.setUnmainSelectable();
				selectingItem.setUnselectable();
			}
		} else if (message.messageType == LocalStorageMessage.DESELECT_TAG) {		
			var selectingTagId = that.SELECT_TAG_TEMP_ID_PREFIX + message.id;
			var selectingIndex = indexOfTagId(that.FILTER_STATE_SELECTED, selectingTagId);
			var tagIndex = indexOfTagId(that.FILTER_STATE_SELECTED, message.id);
			
			if (selectingIndex >= 0) {
				filterData[that.FILTER_STATE_SELECTED].items.splice(selectingIndex, 1);				
			}
			
			if (tagIndex >= 0) {
				filterData[that.FILTER_STATE_SELECTED].items.splice(tagIndex, 1);
			}
			if (that.getFilterState() == that.FILTER_STATE_SELECTED)
				setListState(filterData[that.FILTER_STATE_SELECTED].listState);
		} else if (message.messageType == LocalStorageMessage.RETRIEVE_ADD_TAG) {
			var selectingTagId = that.SELECT_TAG_TEMP_ID_PREFIX + message.tag.id;
			var selectingIndex = indexOfTagId(that.FILTER_STATE_SELECTED, selectingTagId);
			if (selectingIndex < 0)
				return;
			filterData[that.FILTER_STATE_SELECTED].items.splice(selectingIndex, 1);
			
			var selectedTagItem = new TagSearchMenuItem( 
				that, 
				currentUser, 
				messStore, 
				message.tag
			);
			selectedTagItem.setSelected();
			selectedTagItem.setMainSelectable();
			selectedTagItem.setEditable();
			selectedTagItem.setMainSelected();
			
			filterData[that.FILTER_STATE_SELECTED].items.push(selectedTagItem);	
			if (that.getFilterState() == that.FILTER_STATE_SELECTED) {
				setListState(filterData[that.FILTER_STATE_SELECTED].listState);
			}
		} else if (message.messageType == LocalStorageMessage.FINISH_SAVE) {
			for (var i = 0; i < message.storageMessages.length; i++) {
				if (message.storageMessages[i].messageType == StorageMessage.RESPOND_ADD_TAG
					&& message.storageMessages[i].tempId == that.CREATE_TAG_TEMP_ID) {
					var index = indexOfTagId(that.FILTER_STATE_SELECTED, that.CREATE_TAG_TEMP_ID);
					if (index >= 0) {
						filterData[that.FILTER_STATE_SELECTED].items.splice(index, 1);
					}
					
					if (message.storageMessages[i].failure) {
						messStore.deselectTag(message.storageMessages[i].id);
					}
				} else if (message.storageMessages[i].messageType == StorageMessage.RESPOND_REMOVE_TAG) {
					for (var filterState in filterData) {
						var index = indexOfTagId(filterState, message.storageMessages[i].id);
						if (index >= 0) {
							filterData[filterState].items.splice(index, 1);
						}
					}
					
					if (message.storageMessages[i].failure) {
						messStore.deselectTag(message.storageMessages[i].id);
					}
				}
			}

			filterData[that.FILTER_STATE_SELECTED].listState = that.LIST_STATE_READY;
			if (that.getFilterState() == that.FILTER_STATE_SELECTED) {
				setListState(filterData[that.FILTER_STATE_SELECTED].listState);
			}
		} else if (message.messageType == LocalStorageMessage.LOCK_TAG) {
			if (tagEditMenu.getTag() && message.id == tagEditMenu.getTag().id) {
				closeTagEditMenuLink.style.visibility = "hidden";
			}
		} else if (message.messageType == LocalStorageMessage.UNLOCK_TAG) {
			if (tagEditMenu.getTag() && message.id == tagEditMenu.getTag().id) {
				closeTagEditMenuLink.style.visibility = "visible";		
			}
		}
	}
	
	function indexOfTagId(filterState, id) {
		for (var i = 0; i < filterData[filterState].items.length; i++) {
			if (filterData[filterState].items[i].getTag().id == id) {
				return i;
			}
		}
		return -1;
	}
	
	/* Search handler */
	
	function searchRetrieveHandler(storageMessages) {
		if (storageMessages.length == 0 || storageMessages[0].messageType != StorageMessage.RESPOND_RETRIEVE_MESSGRAPH)
			return;
	
		var message = storageMessages[0];
		var messGraph = new MessGraph();
		messGraph.appendObjects(message.messGraph);
		
		// Assumes can't change filter while loading
		var filterStateData = filterData[filterState];
		filterStateData.skips.push(messGraph.getMetaData().nextSkips);
		filterStateData.remainder = messGraph.getMetaData().remainder;
		
		filterStateData.items = [];
		var tagIds = messGraph.getTagIds();
		for (var i = 0; i < tagIds.length; i++) {
			var tagItem = new TagSearchMenuItem(
				that, 
				currentUser, 
				messStore, 
				messGraph.getTag(tagIds[i])
			);
			
			filterStateData.items.push(tagItem);	

			if (filterState != that.FILTER_STATE_SELECTED) {
				for (var j = 0; j < filterData[that.FILTER_STATE_SELECTED].items.length; j++) {
					if (filterData[that.FILTER_STATE_SELECTED].items[j].getTag().id == that.SELECT_TAG_TEMP_ID_PREFIX + tagIds[i]) {
						tagItem.setSelecting();
						break;
					} else if (filterData[that.FILTER_STATE_SELECTED].items[j].getTag().id == tagIds[i]) {
						tagItem.setSelected();
						break;
					}
				}
			}
		}
		
		if (!filteringByYear) {
			filterStateData.listState = that.LIST_STATE_READY;
			setListState(filterStateData.listState);
		}
		
		searching = false;
	}
	
	function retrieveFilterUsersHandler(storageMessages) {
		var userAdded = false;
		for (var i = 0; i < storageMessages.length; i++) {
			if (storageMessages[i].messageType == StorageMessage.RESPOND_RETRIEVE_USERS
				&& storageMessages[i].queryType == retrieveUsers.QUERY_TYPE_ALL) {
				storageMessages[i].users.sort();
				for (var j = 0; j < storageMessages[i].users.length; j++) {
					if (storageMessages[i].users[j] == "Default")
						continue;
						
					var userElement = document.createElement('option');
					userElement.setAttribute('value', storageMessages[i].users[j]);
					userElement.innerHTML = storageMessages[i].users[j];
					filterSelectElement.appendChild(userElement);
					userAdded = true;
				}
			}
		}
		
		if (userAdded) {
			filterSelectElement.value = that.DEFAULT_FILTER_STATE;
			filterSelectChangeHandler();
		}
	}
	
	function filterSelectChangeTagsHandler(storageMessages) {
		for (var i = 0; i < storageMessages.length; i++) {
			if (storageMessages[i].messageType == StorageMessage.RESPOND_RETRIEVE_MESSGRAPH
				&& storageMessages[i].queryType == retrieve.QUERY_TYPE_TAGS_BY_NAMES_AND_USER) {
				var messGraph = new MessGraph();
				messGraph.appendObjects(message.messGraph);
				var tagIds = messGraph.getTagIds();
				for (var i = 0; i < tagIds.length; i++) {
					messStore.selectTag(tagIds[i]);
				}
			}
		}
		
		if (!searching) {
			filterStateData.listState = that.LIST_STATE_READY;
			setListState(filterStateData.listState);
		}
		filteringByYear = false;
	}
	
	/* Getters and setters */
	
	that.setAllUnmainSelected = function() {
		for (var i = 0; i < filterData[that.FILTER_STATE_SELECTED].items.length; i++) {
			filterData[that.FILTER_STATE_SELECTED].items[i].setUnmainSelected();
		}
	}
	
	that.getFilterState = function() {
		return filterState;
	}
	
	that.setTagEditMenu = function(tag) {
		tagEditMenu.setTag(tag);
		if (!tag) {
			tagEditMenuElement.style.visibility = 'hidden';
			closeTagEditMenuLink.style.visibility = 'hidden';	
		} else {
			tagEditMenuElement.style.visibility = 'visible';
			closeTagEditMenuLink.style.visibility = 'visible';
		}
	}
}