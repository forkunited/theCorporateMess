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
function TagEditMenu(container, currentUser, messStore) {
	var that = this;  
	
	this.DOM_HEADING_CLASS = 'tagEditMenuHeading';
	this.DOM_VISIBILITY_CLASS = 'tagEditMenuVisibility';
	this.DOM_VISIBILITY_TEXT_CLASS = 'tagEditMenuVisibilityText';
	this.DOM_VISIBILITY_SELECT_CLASS = 'tagEditMenuVisibilitySelect';
	this.DOM_SHARE_ADD_CLASS = 'tagEditMenuShareAdd';
	this.DOM_SHARE_ADD_TEXT_CLASS = 'tagEditMenuShareAddText';
	this.DOM_SHARE_ADD_INPUT_CLASS = 'tagEditMenuShareAddInput';
	this.DOM_SHARE_ADD_SUBMIT_CLASS = 'tagEditMenuShareAddSubmit';
	this.DOM_SHARE_LIST_CLASS = 'tagEditMenuShareList';
	this.DOM_SHARE_LIST_TEXT_CLASS = 'tagEditMenuShareListText';
	this.DOM_SHARE_LIST_ITEMS_CLASS = 'tagEditMenuShareListItems';
	this.DOM_SHARE_LIST_ITEMS_LOADING_CLASS = 'tagEditMenuShareListItemsLoading';
	this.DOM_SHARE_LIST_ITEM_CLASS = 'tagEditMenuShareListItem';
	this.DOM_SHARE_LIST_ITEM_TEXT_CLASS = 'tagEditMenuShareListItemText';
	this.DOM_SHARE_LIST_ITEM_DELETE_CLASS = 'tagEditMenuShareListItemDelete';
	
	this.VISIBILITY_STATE_ALL = 'Everyone';
	this.VISIBILITY_STATE_SOME = 'Some';
	this.VISIBILITY_STATE_NONE = 'Nobody';
	
	this.VISIBILITY_STATE_ALL_STORAGE = 2;
	this.VISIBILITY_STATE_SOME_STORAGE = 1;
	this.VISIBILITY_STATE_NONE_STORAGE = 0;
	
	/* Elements */
	var headingElement = document.createElement('div');
	var visibilityElement = document.createElement('div');
	var visibilityTextElement = document.createElement('div');
	var visibilitySelectElement = document.createElement('select');
	var visibilitySelectOptionAllElement = document.createElement('option');
	var visibilitySelectOptionSomeElement = document.createElement('option');
	var visibilitySelectOptionNoneElement = document.createElement('option');
	var shareAddElement = document.createElement('div');
	var shareAddTextElement = document.createElement('div');
	var shareAddInputElement = document.createElement('input');
	var shareAddSubmitElement = document.createElement('input');
	var shareListElement = document.createElement('div');
	var shareListTextElement = document.createElement('div');
	var shareListItemsElement = document.createElement('div');
	var shareListItemsLoadingElement = document.createElement('div');
	
	var currentTag = {};
	var currentSharedUsers = [];
	var shareEnabled = false;
	var disabled = false;
	
	var retrieveUsers = new RetrieveUsers();
	
	messStore.addLocalMessageHandler(storeMessageHandler);
	removeElementChildren(container);
	constructInterfaceElements();
	
	function constructInterfaceElements() {
		/* Set Attributes */
		headingElement.setAttribute('class', that.DOM_HEADING_CLASS);
		visibilityElement.setAttribute('class', that.DOM_VISIBILITY_CLASS);
		visibilityTextElement.setAttribute('class', that.DOM_VISIBILITY_TEXT_CLASS);
		visibilitySelectElement.setAttribute('class', that.DOM_VISIBILITY_SELECT_CLASS);
		shareAddElement.setAttribute('class', that.DOM_SHARE_ADD_CLASS); 
		shareAddTextElement.setAttribute('class', that.DOM_SHARE_ADD_TEXT_CLASS); 
		shareAddInputElement.setAttribute('class', that.DOM_SHARE_ADD_INPUT_CLASS);
		shareAddSubmitElement.setAttribute('class', that.DOM_SHARE_ADD_SUBMIT_CLASS);
		shareListElement.setAttribute('class', that.DOM_SHARE_LIST_CLASS);
		shareListTextElement.setAttribute('class', that.DOM_SHARE_LIST_TEXT_CLASS);
		shareListItemsElement.setAttribute('class', that.DOM_SHARE_LIST_ITEMS_CLASS);
		shareListItemsLoadingElement.setAttribute('class', that.DOM_SHARE_LIST_ITEMS_LOADING_CLASS);
		
		shareAddInputElement.setAttribute('type', 'text');
		shareAddSubmitElement.setAttribute('type', 'submit');
		shareAddSubmitElement.setAttribute('value', 'Share');
		
		visibilitySelectOptionAllElement.setAttribute('value', that.VISIBILITY_STATE_ALL);
		visibilitySelectOptionSomeElement.setAttribute('value', that.VISIBILITY_STATE_SOME);
		visibilitySelectOptionNoneElement.setAttribute('value', that.VISIBILITY_STATE_NONE);
		visibilitySelectOptionAllElement.innerHTML = that.VISIBILITY_STATE_ALL;
		visibilitySelectOptionSomeElement.innerHTML = that.VISIBILITY_STATE_SOME;
		visibilitySelectOptionNoneElement.innerHTML = that.VISIBILITY_STATE_NONE;
		
		/* Set up hierarchy */
		container.appendChild(headingElement);
		container.appendChild(visibilityElement);
		container.appendChild(shareAddTextElement);
		container.appendChild(shareAddElement);
		container.appendChild(shareListElement);
		visibilityElement.appendChild(visibilityTextElement);
		visibilityElement.appendChild(visibilitySelectElement);
		visibilitySelectElement.appendChild(visibilitySelectOptionAllElement);
		visibilitySelectElement.appendChild(visibilitySelectOptionSomeElement);
		visibilitySelectElement.appendChild(visibilitySelectOptionNoneElement);
		shareAddElement.appendChild(shareAddInputElement);
		shareAddElement.appendChild(shareAddSubmitElement);
		shareListElement.appendChild(shareListTextElement);
		shareListElement.appendChild(shareListItemsElement);
		
		/* Set interactivity */
		visibilitySelectElement.onchange = visibilitySelectChangeHandler;
		shareAddSubmitElement.onclick = shareAddSubmitClickHandler;
		visibilityTextElement.innerHTML = 'Share with: ';
		shareAddTextElement.innerHTML = 'You would like to share with just some people? Then specify these people by entering their names in this box:';
		shareListTextElement.innerHTML = 'Here are the people you have shared with so far:';
		shareListItemsLoadingElement.innerHTML = 'Loading...';
		
		disableShare();
	}
	
	function removeElementChildren(element) {
		while (element.hasChildNodes()) {
			element.removeChild(element.firstChild);
		}
	}
	
	function disableShare() {
		shareEnabled = false;
		shareAddElement.style.visibility = 'hidden';
		shareAddTextElement.style.visibility = 'hidden';
		shareListElement.style.visibility = 'hidden';
		shareListTextElement.style.visibility = 'hidden';
		shareListItemsElement.style.visibility = 'hidden';
		
		for (var i = 0; i < currentSharedUsers.length; i++) {
			document.getElementById(that.DOM_SHARE_LIST_ITEM_DELETE_CLASS + currentSharedUsers[i]).style.visibility = "hidden";
		}
	}
	
	function enableShare() {
		shareEnabled = true;
		shareAddElement.style.visibility = 'visible';
		shareAddTextElement.style.visibility = 'visible';
		shareListElement.style.visibility = 'visible';
		if (currentSharedUsers.length == 0) {
			shareListTextElement.style.visibility = 'hidden';
		} else {
			shareListTextElement.style.visibility = 'visible';
		}
		shareListItemsElement.style.visibility = 'visible';
		
		if (!disabled) {
			for (var i = 0; i < currentSharedUsers.length; i++) {
				document.getElementById(that.DOM_SHARE_LIST_ITEM_DELETE_CLASS + currentSharedUsers[i]).style.visibility = "visible";
			}
		}
	}
	
	function setVisibilityState(state) {
		visibilitySelectElement.value = state;
		if (state == that.VISIBILITY_STATE_SOME) {
			enableShare();
		} else {
			disableShare();
		}
	}
	
	function disable() {
		disabled = true;
		visibilitySelectElement.disabled = true;
		shareAddInputElement.disabled = true;
		shareAddSubmitElement.disabled = true;
		
		for (var i = 0; i < currentSharedUsers.length; i++) {
			document.getElementById(that.DOM_SHARE_LIST_ITEM_DELETE_CLASS + currentSharedUsers[i]).style.visibility = "hidden";
		}
	}
	
	function enable() {
		disabled = false;
		visibilitySelectElement.disabled = false;
		shareAddInputElement.disabled = false;
		shareAddSubmitElement.disabled = false;
		
		if (shareEnabled) {
			for (var i = 0; i < currentSharedUsers.length; i++) {
				document.getElementById(that.DOM_SHARE_LIST_ITEM_DELETE_CLASS + currentSharedUsers[i]).style.visibility = "visible";
			}
		}
	}
	
	/* Form Handlers */
	
	function visibilitySelectChangeHandler() {
		if (!messStore.lockTag(currentTag.id, that))
			return;
	
		var visibility = undefined;
		if (visibilitySelectElement.value == that.VISIBILITY_STATE_ALL) {
			visibility = that.VISIBILITY_STATE_ALL_STORAGE;
		} else if (visibilitySelectElement.value == that.VISIBILITY_STATE_SOME) {
			visibility = that.VISIBILITY_STATE_SOME_STORAGE;
		} else if (visibilitySelectElement.value == that.VISIBILITY_STATE_NONE) {
			visibility = that.VISIBILITY_STATE_NONE_STORAGE;
		}
		
		if (!messStore.overwriteTag(currentTag.id, currentTag.name, visibility, true)) {
			// FIXME: Handle error
			messStore.unlockTag(currentTag.id, that);
			return;
		}
		currentTag.visibility = visibility;
		
		setVisibilityState(visibilitySelectElement.value);
	}
	
	function shareAddSubmitClickHandler() {
		if (!messStore.lockTag(currentTag.id, that))
			return;
		
		if (!messStore.grantAccessTag(currentTag.id, shareAddInputElement.value, true)) {
			// FIXME: Handle error 
			messStore.unlockTag(currentTag.id, that);
			return;
		}
		
		shareAddSubmitElement.value = "Sharing...";
	}
	
	function shareListItemDeleteClickHandler(user) {
		if (!messStore.lockTag(currentTag.id, that))
			return;
	
		if (!messStore.removeAccessTag(currentTag.id, user, true)) {
			// FIXME: Handle error 
			messStore.unlockTag(currentTag.id, that);
			return;
		}
	
		unshareTagWithUser(user);
	}
	
	/* Retrieval and storage */
	
	function retrieveTagInfo() {
		retrieveUsers.accessToTag(retrieveUsersHandler, currentTag);
		disable();
		while (currentSharedUsers.length > 0) {
			unshareTagWithUser(currentSharedUsers[0]);
		}
		shareListItemsElement.appendChild(shareListItemsLoadingElement);
	}
	
	function storeMessageHandler(message) {
		if (message.messageType == LocalStorageMessage.LOCK_TAG) {
			if (message.lock == that) {
				disable();
			}
		} else if (message.messageType == LocalStorageMessage.UNLOCK_TAG) {
			if (message.lock == that) {
				enable();
			}
		} else if (message.messageType == LocalStorageMessage.FINISH_SAVE) {
			if (!that.getTag())
				return;
			var finishedSave = false;
			for (var i = 0; i < message.storageMessages.length; i++) {
				if (message.storageMessages[i].messageType == StorageMessage.RESPOND_OVERWRITE_TAG
					&& message.storageMessages[i].id == that.getTag().id) {
					if (message.storageMessages[i].failure) {
						// FIXME: Handle failure 
					} else {
						finishedSave = true;
					}
				} else if (message.storageMessages[i].messageType == StorageMessage.RESPOND_GRANT_ACCESS_TAG
					&& message.storageMessages[i].tagId == that.getTag().id) {
					if (message.storageMessages[i].failure) {
						// FIXME: Handle failure 
					} else {
						shareTagWithUser(message.storageMessages[i].userId);
					}
					shareAddSubmitElement.value = "Share";
					shareAddInputElement.value = "";
					finishedSave = true;				
				} else if (message.storageMessages[i].messageType == StorageMessage.RESPOND_REMOVE_ACCESS_TAG
					&& message.storageMessages[i].tagId == that.getTag().id) {
					if (message.storageMessages[i].failure) {
						// FIXME: Handle failure
					} else {
						finishedSave = true;
					}
				}
			}
			
			if (finishedSave) {
				messStore.unlockTag(currentTag.id, that);
			}
		} 
	}
	
	function retrieveUsersHandler(storageMessages) {
		if (!that.getTag())
			return;
	
		for (var i = 0; i < storageMessages.length; i++) {
			if (storageMessages[i].messageType == StorageMessage.RESPOND_RETRIEVE_USERS
				&& storageMessages[i].queryType == retrieveUsers.QUERY_TYPE_ACCESS_TO_TAG
				&& storageMessages[i].params.tagId == that.getTag().id) {
				// FIXME: Handle failure...
				enable();
				removeElementChildren(shareListItemsElement);
				for (var j = 0; j < storageMessages[i].users.length; j++) {
					shareTagWithUser(storageMessages[i].users[j]);
				}
			}
		}
	}
	
	/* Manage user list */
	
	function shareTagWithUser(user) {
		for (var i = 0; i < currentSharedUsers.length; i++) {
			if (user == currentSharedUsers[i])
				return;
		}
		
		currentSharedUsers.push(user);
		
		var shareListItemElement = document.createElement('div');
		var shareListItemTextElement = document.createElement('div');
		var shareListItemDeleteElement = document.createElement('div');
		
		shareListItemElement.setAttribute('class', that.DOM_SHARE_LIST_ITEM_CLASS);
		shareListItemTextElement.setAttribute('class', that.DOM_SHARE_LIST_ITEM_TEXT_CLASS);
		shareListItemDeleteElement.setAttribute('class', that.DOM_SHARE_LIST_ITEM_DELETE_CLASS);
		shareListItemElement.setAttribute('id', that.DOM_SHARE_LIST_ITEM_CLASS + user);
		shareListItemTextElement.setAttribute('id', that.DOM_SHARE_LIST_ITEM_TEXT_CLASS + user);
		shareListItemDeleteElement.setAttribute('id', that.DOM_SHARE_LIST_ITEM_DELETE_CLASS + user);
		
		shareListItemsElement.appendChild(shareListItemElement);
		shareListItemElement.appendChild(shareListItemTextElement);
		shareListItemElement.appendChild(shareListItemDeleteElement);
		
		shareListItemTextElement.innerHTML = user;
		
		var unshareLink = document.createElement('a');
		unshareLink.setAttribute("href", "javascript:void(0)");
		unshareLink.innerHTML = '[Unshare]';
		unshareLink.onclick = function() { shareListItemDeleteClickHandler(user); };
		shareListItemDeleteElement.appendChild(unshareLink);
		
		if (shareEnabled)
			shareListTextElement.style.visibility = 'visible';
	}
	
	function unshareTagWithUser(user) {
		var userIndex = currentSharedUsers.indexOf(user);
		if (userIndex < 0)
			return;
		currentSharedUsers.splice(userIndex, 1);
		
		for (var i = 0; i < shareListItemsElement.childNodes.length; i++) {
			if (shareListItemsElement.childNodes[i].getAttribute('id') == that.DOM_SHARE_LIST_ITEM_CLASS + user) {
				shareListItemsElement.removeChild(shareListItemsElement.childNodes[i]);
				break;
			}
		}
		
		if (currentSharedUsers.length == 0)
			shareListTextElement.style.visibility = 'hidden';
	}
	
	/* Getters and setters */
	
	this.setTag = function(tag) {
		currentTag = tag;
		
		if (!currentTag) {
			disableShare();
			return;
		}
		
		if (tag.visibility == that.VISIBILITY_STATE_ALL_STORAGE) {
			setVisibilityState(that.VISIBILITY_STATE_ALL);
		} else if (tag.visibility == that.VISIBILITY_STATE_SOME_STORAGE) {
			setVisibilityState(that.VISIBILITY_STATE_SOME);
		} else if (tag.visibility == that.VISIBILITY_STATE_NONE_STORAGE) {
			setVisibilityState(that.VISIBILITY_STATE_NONE);
		}
		
		headingElement.innerHTML = tag.name;
		retrieveTagInfo();
	}
	
	this.getTag = function() {
		return currentTag;
	}
}