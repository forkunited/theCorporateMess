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
function TagSearchMenuItem(tagSearchMenu, currentUser, messStore, tag) {
	var that = this;  
	
	this.MAX_NAME_LENGTH = 12;
	
	this.SELECT_STATE_SELECTED = 0;
	this.SELECT_STATE_UNSELECTED = 1;
	this.SELECT_STATE_SELECTING = 2;
	
	this.DOM_CLASS = 'tagSearchMenuItem';
	this.DOM_HIGHLIGHTED_CLASS = 'tagSearchMenuItemHighlighted';
	this.DOM_LEFT_CLASS = 'tagSearchMenuItemLeft';
	this.DOM_RIGHT_CLASS = 'tagSearchMenuItemRight';
	this.DOM_TEXT_CLASS = 'tagSearchMenuItemText';
	this.DOM_SUBTEXT_CLASS = 'tagSearchMenuItemSubtext';
	this.DOM_TEXT_SELECTED_CLASS = 'tagSearchMenuItemTextSelected';
	this.DOM_SUBTEXT_SELECTED_CLASS = 'tagSearchMenuItemSubtextSelected';
	this.DOM_OPTIONS_CLASS = 'tagSearchMenuItemOptions';
	this.DOM_DELETE_CLASS = 'tagSearchMenuItemDelete';
	this.DOM_SELECT_CLASS = 'tagSearchMenuItemSelect';
	this.DOM_SELECT_INPUT_CLASS = 'tagSearchMenuItemSelectInput';
	
	var element = document.createElement('div');
	var leftElement = document.createElement('div');
	var rightElement = document.createElement('div');
	var textElement = document.createElement('div');
	var subtextElement = document.createElement('div');
	var optionsElement = document.createElement('div');	
	var deleteElement = document.createElement('div');	
	var selectElement = document.createElement('div');	
	var selectInputElement = document.createElement('input');
	var optionsLinkElement = document.createElement('a');
	var deleteLinkElement = document.createElement('a');
	
	var editable = false;
	var mainSelectable = false;
	var selectable = true;
	var mainSelected = false;
	var highlighted = false;
	var disabled = false;
	
	var selected = that.SELECT_STATE_UNSELECTED;
	
	var defaultColor = "";
	
	constructInterfaceElements();

	function constructInterfaceElements() {
		/* Set Attributes */
		element.setAttribute('class', that.DOM_CLASS);
		leftElement.setAttribute('class', that.DOM_LEFT_CLASS);
		rightElement.setAttribute('class', that.DOM_RIGHT_CLASS);
		textElement.setAttribute('class', that.DOM_TEXT_CLASS);
		subtextElement.setAttribute('class', that.DOM_SUBTEXT_CLASS);
		optionsElement.setAttribute('class', that.DOM_OPTIONS_CLASS);
		deleteElement.setAttribute('class', that.DOM_DELETE_CLASS);	
		selectElement.setAttribute('class', that.DOM_SELECT_CLASS);
		selectInputElement.setAttribute('class', that.DOM_SELECT_INPUT_CLASS);	

		element.setAttribute('id', that.DOM_CLASS + "_" + tag.id);
		leftElement.setAttribute('id', that.DOM_LEFT_CLASS + "_" + tag.id);
		rightElement.setAttribute('id', that.DOM_RIGHT_CLASS + "_" + tag.id);
		textElement.setAttribute('id', that.DOM_TEXT_CLASS + "_" + tag.id);
		subtextElement.setAttribute('id', that.DOM_SUBTEXT_CLASS + "_" + tag.id);
		optionsElement.setAttribute('id', that.DOM_OPTIONS_CLASS + "_" + tag.id);
		deleteElement.setAttribute('id', that.DOM_DELETE_CLASS + "_" + tag.id);	
		selectElement.setAttribute('id', that.DOM_SELECT_CLASS + "_" + tag.id);
		selectInputElement.setAttribute('id', that.DOM_SELECT_INPUT_CLASS + "_" + tag.id);

		selectInputElement.setAttribute('type', 'checkbox');
		
		if (tag.name.length <= that.MAX_NAME_LENGTH) {
			textElement.innerHTML = tag.name;
		} else {
			textElement.innerHTML = tag.name.substring(0, that.MAX_NAME_LENGTH - 3) + "...";
		}
		
		subtextElement.innerHTML = ' (' + tag.creatorUserId + ')';
		deleteLinkElement.innerHTML = '[Delete]';
		optionsLinkElement.innerHTML = '[Edit]';
		
		/* Set up hierarchy */
		element.appendChild(leftElement);
		element.appendChild(rightElement);
		leftElement.appendChild(textElement);
		leftElement.appendChild(subtextElement);
		rightElement.appendChild(selectElement);	
		rightElement.appendChild(optionsElement);
		rightElement.appendChild(deleteElement);
		optionsElement.appendChild(optionsLinkElement);	
		selectElement.appendChild(selectInputElement);
		deleteElement.appendChild(deleteLinkElement);
	
		/* Set interactivity */
		element.onmouseover = elementMouseOverHandler;
		element.onmouseout = elementMouseOutHandler;
		element.onclick = elementClickHandler;
		optionsLinkElement.onclick = optionsLinkClickHandler;
		deleteLinkElement.onclick = deleteLinkClickHandler;
		selectInputElement.onclick = selectInputClickHandler;
		
		defaultColor = element.style.backgroundColor;
	}
	
	/* Interactivity handlers */
	
	that.storeMessageHandler = function(message) {
		if (message.messageType == LocalStorageMessage.SELECT_TAG) {
			if (message.id == tag.id) {
				that.setSelecting();
			}
		} else if (message.messageType == LocalStorageMessage.DESELECT_TAG) {		
			if (message.id == tag.id) {
				that.setUnselected();
			}
		} else if (message.messageType == LocalStorageMessage.RETRIEVE_ADD_TAG) {
			if (selected == that.SELECT_STATE_SELECTING && message.tag.id == tag.id) {
				tag = message.tag;
				that.setSelected();
			}
		} else if (message.messageType == LocalStorageMessage.FINISH_SAVE) {
			/* ? */
		} else if (message.messageType == LocalStorageMessage.START_SAVE) {
			if (editable)
				setDeletable();
		}
	}

	function elementMouseOverHandler() {
		that.setHighlighted();
	}
	
	function elementMouseOutHandler() {
		that.setUnhighlighted();
	}
	
	function elementClickHandler() {
		if (mainSelectable) {
			if (!mainSelected)
				that.setMainSelected();
		} else if (selectable) {		
			if (selected != that.SELECT_STATE_SELECTED)
				messStore.selectTag(tag.id);
			else if (selected != that.SELECT_STATE_UNSELECTED)
				messStore.deselectTag(tag.id);
		}
	}
	
	function optionsLinkClickHandler() {
		tagSearchMenu.setTagEditMenu(tag);
	}
	
	function deleteLinkClickHandler() {
		textElement.innerHTML = 'Removing ' + tag.name + '...';
		that.hideSubtext();
		tagSearchMenu.setTagEditMenu();
		
		messStore.removeTag(tag.id, true);
		if (selected == that.SELECT_STATE_SELECTED)
			messStore.deselectTag(tag.id);
		that.setUneditable();
	}
	
	function selectInputClickHandler() {
		if (selected == that.SELECT_STATE_SELECTED) 
			messStore.deselectTag(tag.id);
		else
			messStore.selectTag(tag.id);
	}
	
	/* Getters and setters */
	
	this.getElement = function() {
		return element;
	}
	
	this.getTag = function() {
		return tag;
	}
	
	this.getSelected = function() {
		return selected;
	}
	
	this.setSelected = function() {
		if (disabled)
			return;
	
		if (!messStore.getTag(tag.id))
			return;
			
		that.showSubtext();
		that.setUnhighlighted();
		textElement.innerHTML = tag.name;
		
		var tagColor = messStore.getTagColor(tag.id);
		element.style.backgroundColor = tagColor;
		
		textElement.setAttribute('class', that.DOM_TEXT_SELECTED_CLASS);
		subtextElement.setAttribute('class', that.DOM_SUBTEXT_SELECTED_CLASS);
		
		selected = that.SELECT_STATE_SELECTED;
	}
	
	this.setUnselected = function() {
		if (disabled)
			return;
	
		that.setUnhighlighted();
		that.setUnmainSelected();
		textElement.innerHTML = tag.name;
		element.style.backgroundColor = defaultColor;
			
		textElement.setAttribute('class', that.DOM_TEXT_CLASS);
		subtextElement.setAttribute('class', that.DOM_SUBTEXT_CLASS);
		
		selected = that.SELECT_STATE_UNSELECTED;
	}
	
	this.setSelecting = function() {
		textElement.innerHTML = 'Selecting ' + tag.name + '...';
		that.hideSubtext();
		selected = that.SELECT_STATE_SELECTING;
	}
	
	this.getMainSelected = function() {
		return mainSelected;
	}
	
	this.setMainSelected = function() {
		if (disabled)
			return;
	
		if (!mainSelectable || selected != that.SELECT_STATE_SELECTED)
			return;
		
		tagSearchMenu.setAllUnmainSelected();
		messStore.selectMainTag(tag.id);
		textElement.style.fontWeight = "bold";
		mainSelected = true;
	}
	
	this.setUnmainSelected = function() {
		if (disabled)
			return;
	
		if (!mainSelectable || selected != that.SELECT_STATE_SELECTED)
			return;
		if (mainSelected)
			messStore.selectMainTag(undefined);
		textElement.style.fontWeight = "normal";
		mainSelected = false;
	}
	
	this.setHighlighted = function() {
		if (disabled)
			return;
	
		if (selected != that.SELECT_STATE_UNSELECTED)
			return;
		element.setAttribute('class', that.DOM_HIGHLIGHTED_CLASS);
	}
	
	this.setUnhighlighted = function() {
		if (disabled)
			return;
	
		if (selected != that.SELECT_STATE_UNSELECTED)
			return;
		element.setAttribute('class', that.DOM_CLASS);
	}
	
	this.setEditable = function() {
		if (disabled)
			return;
	
		if (!tag.writeAccess)
			return;
		
		setDeletable();
		optionsElement.style.visibility = "visible";
		editable = true;
	}
	
	this.setUneditable = function() {
		if (disabled)
			return;
	
		setUndeletable();
		optionsElement.style.visibility = "hidden";
		editable = false;
	}
	
	this.setMainSelectable = function() {
		if (disabled)
			return;
	
		if (!tag.writeAccess || !selectable)
			return;
			
		selectInputElement.style.visibility = "visible";
		selectInputElement.checked = true;
		mainSelectable = true;
	}
	
	this.setUnmainSelectable = function() {
		if (disabled)
			return;
	
		selectInputElement.style.visibility = "hidden";
		mainSelectable = false;
	}
	
	this.setSelectable = function() {
		if (disabled)
			return;
	
		selectable = true;
	}
	
	this.setUnselectable = function() {
		if (disabled)
			return;
	
		selectable = false;
	}
	
	this.hideSubtext = function() {
		subtextElement.style.visibility = "hidden";
	}
	
	this.showSubtext = function() {
		subtextElement.style.visibility = "visible";
	}
	
	function setDeletable() {
		if (disabled)
			return;
	
		if (!tag.writeAccess || selected != that.SELECT_STATE_SELECTED || !messStore.getTag(tag.id) || messStore.getTag(tag.id).nodeCount != 0) {
			setUndeletable();
			return;
		}
		deleteElement.style.visibility = "visible";
	}
	
	function setUndeletable() {
		if (disabled)
			return;
	
		deleteElement.style.visibility = "hidden";
	}
	
	this.disable = function() {
		disabled = true;
		
		optionsElement.style.visibility = "hidden";
		deleteElement.style.visibility = "hidden";
		selectInputElement.style.visibility = "hidden";
	}
	
	this.enable = function() {
		disabled = false;
		if (editable)
			that.setEditable();
		if (mainSelectable)
			that.setMainSelectable();
	}
	
	/* Defaults */
	that.setUneditable();
	that.setUnmainSelectable();
	messStore.addLocalMessageHandler(that.storeMessageHandler);
}