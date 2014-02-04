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
function UI(container, currentUser) {
	var that = this;  
	
	/* Color stuff */
	this.SHOW_CONTENT_DEFAULT_COLOR = "#000000";
	this.SHOW_CONTENT_HIGHLIGHT_COLOR = "#333333";
	this.SHOW_CONTENT_DEFAULT_FONT_COLOR = "#FFFFFF";
	this.SHOW_CONTENT_FOCUS_FONT_COLOR = "#000000";
	
	/* Status stuff */
	this.UPDATE_MOUSE_INTERVAL = 50;
	
	/* DOM Element Ids and Classes */
	this.DOM_SIDE_REGION_ID = 'uiSideRegion';
	this.DOM_TOP_REGION_ID = 'uiTopRegion';
	this.DOM_CONTENT_REGION_ID = 'uiContentRegion';
	this.DOM_BOTTOM_REGION_ID = 'uiBottomRegion';
	this.DOM_TAG_MENU_ID = 'uiTagMenu';
	this.DOM_INSTRUCTIONS_ID = 'uiInstructions';
	this.DOM_MESS_ID = 'uiMess';
	this.DOM_MESS_OVERLAY_ID = 'uiMessOverlay';
	this.DOM_STATUS_ID = 'uiStatus';
	this.DOM_EDIT_LABEL_ID = 'uiEditLabel';
	this.DOM_EDIT_CONTENT_ID = 'uiEditContent';
	this.DOM_SUBMIT_EDIT_ID = 'uiSubmitEdit';
	this.DOM_SHOW_CONTENT_ID = 'uiShowContent';
	this.DOM_TOP_LINKS_ID = 'uiTopLinks';
	this.DOM_TOP_LINKS_BODY_ID = 'uiTopLinksBody';
	
	this.DOM_LAYOUT_DROP_DOWN_ID = 'uiLayout';
	this.DOM_COLORS_DROP_DOWN_ID = 'uiColors';
	this.DOM_INTERFACE_DROP_DOWN_ID = 'uiInterface';
	this.DOM_QUERY_DROP_DOWN_ID = 'uiQuery';
	//this.DOM_EXPORT_DROP_DOWN_ID = 'uiExport';
	//this.DOM_IMPORT_DROP_DOWN_ID = 'uiImport';
	this.DOM_HELP_DROP_DOWN_ID = 'uiHelp';
	
	this.DOM_INSTRUCTIONS_HEADING_ID = 'uiInstructionsHeading';
	this.DOM_INSTRUCTIONS_CONTENT_ID = 'uiInstructionsContent';
	this.DOM_INSTRUCTIONS_KEYS_ID = 'uiInstructionsKeys';
	
	/* Key bindings */
	this.KEYBOARD_TOGGLE_INSTRUCTIONS = "H";
	this.KEYBOARD_SAVE_THE_MESS = "P";
	this.KEYBOARD_EDIT_VERT = "Ctrl+Enter";
	this.KEYBOARD_ADD_VERT = "V";
	this.KEYBOARD_REMOVE_VERTS = "Shift+V";
	this.KEYBOARD_TOGGLE_MAIN_VERTS = "M";
	this.KEYBOARD_ADD_EDGES = "E";
	this.KEYBOARD_REMOVE_EDGES = "Shift+E";
	this.KEYBOARD_DIRECTION_EDGES = "D";
	this.KEYBOARD_TYPE_EDGES = "T";
	this.KEYBOARD_GROUP_EDGES = "G";
	this.KEYBOARD_SELECT_VERTS = "S";
	this.KEYBOARD_DESELECT_VERTS = "Shift+S";
	this.KEYBOARD_SCROLL_LEFT = "Left";
	this.KEYBOARD_SCROLL_RIGHT = "Right";
	this.KEYBOARD_SCROLL_UP = "Up";
	this.KEYBOARD_SCROLL_DOWN = "Down";
	this.KEYBOARD_UNDO = "Ctrl+Z";
	this.KEYBOARD_SHRINK_HIGHLIGHT = "Backspace";
	this.KEYBOARD_APPEND_HIGHLIGHT_0 = "0";
	this.KEYBOARD_APPEND_HIGHLIGHT_1 = "1";
	this.KEYBOARD_APPEND_HIGHLIGHT_2 = "2";
	this.KEYBOARD_APPEND_HIGHLIGHT_3 = "3";
	this.KEYBOARD_APPEND_HIGHLIGHT_4 = "4";
	this.KEYBOARD_APPEND_HIGHLIGHT_5 = "5";
	this.KEYBOARD_APPEND_HIGHLIGHT_6 = "6";
	this.KEYBOARD_APPEND_HIGHLIGHT_7 = "7";
	this.KEYBOARD_APPEND_HIGHLIGHT_8 = "8";
	this.KEYBOARD_APPEND_HIGHLIGHT_9 = "9";
	this.KEYBOARD_APPEND_HIGHLIGHT_DOT = ".";
	
	/* Import/Export */
	this.IMPORT_EXPORT_WIDTH = 600;
	this.IMPORT_EXPORT_HEIGHT = 500;
	
	/* Mouse handling */
	this.DOUBLE_CLICK_TIMEOUT = 500;
	this.SINGLE_CLICK_TIMEOUT = 500;
	this.MOUSE_MOVE_TIMEOUT = 50;
	
	/* Instructions stuff */
	this.INSTRUCTIONS_BODY_TEXT = "<p>Hi.  This box contains quick reference for understanding which keys to press to do things with this program.  If you want " +
								  "more detailed information about this program and how to use it, then click the \"Instructions\" link in the menu on the left.  A mess of " +
								  "detailed instructions will pop up.  Hover over the dot with a white circle around it when this mess pops up to begin following along with the instructions.</p>" +
								  "<p>If you're done reading the text in this box, then click the box, and it will close.  If you want to see this box again, " +
								  "then click the \"Quick Reference\" link under the \"Help\" menu at the top of the page.</p>";
	
	this.INSTRUCTIONS_FOOTER_TEXT = '<p>Please use <a href="https://www.google.com/intl/en/chrome/browser/" target="_blank">Google Chrome</a>.</p>';
	
	if (!container)
		container = document.body;
	
	/* Elements */
	var sideRegionElement = document.createElement('div');
	var topRegionElement = document.createElement('div');
	var contentRegionElement = document.createElement('div');
	var bottomRegionElement = document.createElement('div');
	var tagMenuElement = document.createElement('div');
	var instructionsElement = document.createElement('div');
	var messElement = document.createElement('canvas');
	var messOverlayElement = document.createElement('canvas');
	var statusElement = document.createElement('div');
	var editLabelElement = document.createElement('div');
	var editContentElement = document.createElement('div');
	var submitEditElement = document.createElement('input');
	var showContentElement = document.createElement('div');
	var topLinksElement= document.createElement('div');
	var topLinksBodyElement= document.createElement('div');
	
	/* Components */
	var messStore = new MessStore(currentUser);
	var messControl = new MessViewControl(messElement, messOverlayElement, currentUser, messStore);
	// NOTE: Placing tag edit menu in tagMenuElement prevents race conditions.  This is a hack for now.
	var tagMenu = new TagSearchMenu(tagMenuElement, tagMenuElement, currentUser, messStore); 
	
	/* Import/Export */
	var exportWindow = undefined;
	var importWindow = undefined;
	
	/* Mouse handling */
	var mousePosX = 0;
	var mousePosY = 0;
	var messMouseUpTime = 0;
	var messMouseDownTime = 0;
	var messMouseMoveTime = 0;
	
	var editingContent = false;
	
	/* Construction and destruction */
	
	this.construct = function() {
		removeContainerChildren();
		constructInterfaceElements();
		constructComponents();
	}
	
	this.destroy = function() {
		removeContainerChildren();
	}
	
	function constructInterfaceElements() {
		/* Set Attributes */
		sideRegionElement.setAttribute('id', that.DOM_SIDE_REGION_ID);
		topRegionElement.setAttribute('id', that.DOM_TOP_REGION_ID);
		contentRegionElement.setAttribute('id', that.DOM_CONTENT_REGION_ID);
		bottomRegionElement.setAttribute('id', that.DOM_BOTTOM_REGION_ID);
		tagMenuElement.setAttribute('id', that.DOM_TAG_MENU_ID);
		instructionsElement.setAttribute('id', that.DOM_INSTRUCTIONS_ID);
		statusElement.setAttribute('id', that.DOM_STATUS_ID);
		editLabelElement.setAttribute('id', that.DOM_EDIT_LABEL_ID);
		editContentElement.setAttribute('id', that.DOM_EDIT_CONTENT_ID);
		submitEditElement.setAttribute('id', that.DOM_SUBMIT_EDIT_ID);
		showContentElement.setAttribute('id', that.DOM_SHOW_CONTENT_ID);
		topLinksElement.setAttribute('id', that.DOM_TOP_LINKS_ID);
		topLinksBodyElement.setAttribute('id', that.DOM_TOP_LINKS_BODY_ID);
		messElement.setAttribute('id', that.DOM_MESS_ID);
		messOverlayElement.setAttribute('id', that.DOM_MESS_OVERLAY_ID);
		
		submitEditElement.setAttribute('type', 'submit');
		
		/* Set up hierarchy */
		container.appendChild(sideRegionElement);
		container.appendChild(topRegionElement);
		container.appendChild(contentRegionElement);
		container.appendChild(bottomRegionElement);
		sideRegionElement.appendChild(tagMenuElement);
		contentRegionElement.appendChild(messElement);
		contentRegionElement.appendChild(messOverlayElement);
		contentRegionElement.appendChild(editLabelElement);
		contentRegionElement.appendChild(instructionsElement);
		contentRegionElement.appendChild(topLinksBodyElement);
		topRegionElement.appendChild(topLinksElement);
		topRegionElement.appendChild(statusElement);
		bottomRegionElement.appendChild(editContentElement);
		bottomRegionElement.appendChild(submitEditElement);
		bottomRegionElement.appendChild(showContentElement);
	
		/* Set interactivity */
		messOverlayElement.tabIndex = 1;
		editLabelElement.contentEditable = true;
		editLabelElement.onkeydown = function(e) { return !((e.charCode && e.charCode == 13) || e.keyCode == 13) }; // Disable "enter" key (no new lines allowed in label box)
		editContentElement.contentEditable = true;
		instructionsElement.onclick = function() { instructionsElement.style.display = 'none';};
		messOverlayElement.addEventListener("mousedown", messMouseDown, false);
		messOverlayElement.addEventListener("mouseup", messMouseUp, false); 
		messOverlayElement.addEventListener("mousemove", messMouseMove, false);
		//showContentElement.onclick = function() { messControl.editFocus(); };
		/*showContentElement.onmouseover = function() { 
														showContentElement.style.backgroundColor = that.SHOW_CONTENT_HIGHLIGHT_COLOR; 
														showContentElement.style.color = that.SHOW_CONTENT_DEFAULT_FONT_COLOR;
													};
		showContentElement.onmouseout = function() { 
														showContentElement.style.backgroundColor = that.SHOW_CONTENT_DEFAULT_COLOR; 
														showContentElement.style.color = that.SHOW_CONTENT_DEFAULT_FONT_COLOR;*/
		//											};
		//submitEditElement.onclick = function() { messControl.finishEditFocus(); };
		
		messElement.width = messElement.offsetWidth;
		messElement.height = messElement.offsetHeight;
		messOverlayElement.width = messOverlayElement.offsetWidth;
		messOverlayElement.height = messOverlayElement.offsetHeight;
		
		/* Other stuff */
		window.onresize = function(event) { messElement.width = messElement.offsetWidth; 
											messElement.height = messElement.offsetHeight; 
											messOverlayElement.width = messOverlayElement.offsetWidth;
											messOverlayElement.height = messOverlayElement.offsetHeight;
											setVisibleMessWindow();}
											
		//topLinksElement.style.visibility = 'hidden'; // HACK: Hide top links for now...
	}
	
	function constructComponents() {
		constructTopLinks();
		constructInstructions();
		
		window.setInterval(updateMouse, that.UPDATE_MOUSE_INTERVAL);
		
		messControl.setEditContentFunctions(function() { return editLabelElement.innerHTML; }, 
											function() { return editContentElement.innerHTML; },
											function() { return editLabelElement.offsetLeft + editLabelElement.offsetWidth/2.0},
											function() { return editLabelElement.offsetTop - 15; });
					
		messControl.setUpdateFunctions(function() {	updateStatus(); },
									   function() { updateContent(); },
									   function(noLabel) { updateEditContent(noLabel); }
									   );
			
		setVisibleMessWindow();
		messStore.addLocalMessageHandler(storeMessageHandler);
		messStore.init();
		updateFromURL();
	}
	
	function setVisibleMessWindow() {
		messControl.setFullVisibleWindow(topRegionElement.offsetHeight, /* top */
										sideRegionElement.offsetWidth, /* left */
										bottomRegionElement.offsetTop-topRegionElement.offsetHeight, /* height */
										container.offsetWidth - sideRegionElement.offsetWidth); /* width */
	}
	
	function constructInstructions() {
		var headingElement = document.createElement('div');
		var bodyElement = document.createElement('div');
		var keysElement = document.createElement('div');
		var footerElement = document.createElement('div');
		
		headingElement.setAttribute('id', that.DOM_INSTRUCTIONS_HEADING_ID);
		bodyElement.setAttribute('id', that.DOM_INSTRUCTIONS_CONTENT_ID);
		keysElement.setAttribute('id', that.DOM_INSTRUCTIONS_KEYS_ID);
		footerElement.setAttribute('id', that.DOM_INSTRUCTIONS_CONTENT_ID);
		
		instructionsElement.appendChild(headingElement);
		instructionsElement.appendChild(bodyElement);
		instructionsElement.appendChild(keysElement);
		instructionsElement.appendChild(footerElement);
		
		headingElement.innerHTML = 'Help?';
		bodyElement.innerHTML = that.INSTRUCTIONS_BODY_TEXT;
		
		var keys = '';
		keys += 'Show/Hide Instructions: <b>' + that.KEYBOARD_TOGGLE_INSTRUCTIONS + '</b><br />';
		keys += 'Save Changes: <b>' + that.KEYBOARD_SAVE_THE_MESS + '</b><br />';
		keys += 'Scroll: <b>Arrow Keys</b><br />'; // Probably will never change these keys.
		keys += 'Create Dot: <b>' + that.KEYBOARD_ADD_VERT + '</b><br />';
		keys += 'Highlight Dots: <b>.</b>,<b>0</b>,<b>1</b>,<b>2</b>,<b>3</b>,<b>4</b>,<b>5</b>,<b>6</b>,<b>7</b>,<b>8</b>,<b>9</b><br />'; // Probably will never change these keys
		keys += 'Select Highlighted Dots: <b>' + that.KEYBOARD_SELECT_VERTS + '</b><br />';
		keys += 'Deselect Highlighted Dots: <b>' + that.KEYBOARD_DESELECT_VERTS + '</b><br />';
		keys += 'Edit Selected Dot Text: <b>' + that.KEYBOARD_EDIT_VERT + '</b><br />';
		keys += 'Remove Selected Dots: <b>' + that.KEYBOARD_REMOVE_VERTS + '</b><br />';
		keys += 'Add Lines Between Selected Dots: <b>' + that.KEYBOARD_ADD_EDGES + '</b><br />';
		keys += 'Remove Lines Between Selected Dots: <b>' + that.KEYBOARD_REMOVE_EDGES + '</b><br />';
		keys += 'Swap Line Directions Between Selected Dots: <b>' + that.KEYBOARD_DIRECTION_EDGES + '</b><br />';
		keys += 'Change Line Types Between Selected Dots: <b>' + that.KEYBOARD_TYPE_EDGES + '</b><br />';
		keys += 'Change Line Colors Between Selected Dots: <b>' + that.KEYBOARD_GROUP_EDGES + '</b><br />';
		keys += 'Toggle Main Selected Dots: <b>' + that.KEYBOARD_TOGGLE_MAIN_VERTS + '</b><br />';
		keys += 'Undo: <b>' + that.KEYBOARD_UNDO + '</b><br />';
		keysElement.innerHTML = keys;
		
		footerElement.innerHTML = that.INSTRUCTIONS_FOOTER_TEXT;
	
		instructionsElement.style.display = 'none'; // HACK: No instructions now
	}
	
	function constructTopLinks() {
		var layoutMenu = new DropDownMenu(topLinksElement, topLinksBodyElement, that.DOM_LAYOUT_DROP_DOWN_ID, 'Layout', true);
		layoutMenu.addLink('springs', 'Springs', function() { 
																var animation = new VisualAnimationSprings();
																animation.setAnimateClusters(false);
																animation.setAnimateVertices(true);
																animation.setAnimateHyperEdges(true);
																messControl.getVisual().setAnimation(animation); 
																messControl.getVisual().setAnimationClusterer(new GraphClustererWeakComponents()); 
															} 
						   );
						   
		layoutMenu.addLink('none', 'None', function() { 
															messControl.getVisual().setAnimation(undefined); 
															messControl.getVisual().setAnimationClusterer(undefined);
													  } );	
		
		var colorsMenu = new DropDownMenu(topLinksElement, topLinksBodyElement, that.DOM_COLORS_DROP_DOWN_ID, 'Colors', true);
		colorsMenu.addLink('black', 'Black', function() { messElement.style.backgroundColor = "#000000"; messControl.setTagVertColor("#FFFFFF"); });
		colorsMenu.addLink('white', 'White', function() { messElement.style.backgroundColor = "#FFFFFF"; messControl.setTagVertColor("#000000"); });
		
		var interfaceMenu = new DropDownMenu(topLinksElement, topLinksBodyElement, that.DOM_INTERFACE_DROP_DOWN_ID, 'Interface', true);
		interfaceMenu.addLink('show', 'Show', function() { showInterface(); });
		interfaceMenu.addLink('hide', 'Hide', function() { hideInterface(); });
		
		var queryMenu = new DropDownMenu(topLinksElement, topLinksBodyElement, that.DOM_QUERY_DROP_DOWN_ID, 'Query', false);
		queryMenu.addLink('run', 'Run', runQuery);
		queryMenu.addLink('generate', 'Generate', generateQuery);
		
		/*
		var helpMenu = new DropDownMenu(topLinksElement, topLinksBodyElement, that.DOM_HELP_DROP_DOWN_ID, 'Help', false);
		helpMenu.addLink('quickReference', 'Quick Reference', toggleInstructions);	*/		
	}
	
	function removeContainerChildren() {
		var len = container.childNodes.length;

		while (container.hasChildNodes()) {
			container.removeChild(container.firstChild);
		}
	}
	
	/* Show/Hide interface elements */
	
	function showInterface() {
		topLinksBodyElement.style.top = "10%";
		topLinksBodyElement.style.left = "30%";
		topRegionElement.style.width = "70%";
		topRegionElement.style.height = "10%";
		topRegionElement.style.left = "30%";
		sideRegionElement.style.display = "inline";
		bottomRegionElement.style.display = "inline";
		bottomRegionElement.style.display = "inline";
		setVisibleMessWindow();
	}
	
	function hideInterface() {
		topLinksBodyElement.style.top = "22px";
		topLinksBodyElement.style.left = "0%";
		topRegionElement.style.width = "100%";
		topRegionElement.style.height = "22px";
		topRegionElement.style.left = "0%";
		sideRegionElement.style.display = "none";
		bottomRegionElement.style.display = "none";
		bottomRegionElement.style.display = "none";
		messControl.setFullVisibleWindow(topRegionElement.offsetHeight, /* top */
								messElement.offsetLeft, /* left */
								messElement.offsetHeight-topRegionElement.offsetHeight, /* height */
								messElement.offsetWidth); /* width */
	}
	
	/* Mess store change handler */
	
	function storeMessageHandler(message) {
		if (message.messageType == LocalStorageMessage.SELECT_TAG
			|| message.messageType == LocalStorageMessage.DESELECT_TAG
			|| message.messageType == LocalStorageMessage.RETRIEVE_ADD_TAG) {
			updateToWindowURL();
		}
	}
	
	var updatingFromURL = false;
	
	/* Update from/to URL */
	function updateToWindowURL() {
		if (updatingFromURL || !history || !history.pushState)
			return;
		var tagIds = messStore.getSelectedTagIds(true);
		//if (tagIds.length > 100) { // FIXME: Hack. Add this back in if necessary.
		//	tagIds = tagIds.slice(0, 99);
		//}

		var search = "?filter=" + tagMenu.getFilterUser() + "&tags=" + JSON.stringify(tagIds);
		if (window.location.search.replace(/%22/g,"\"") != search)
			history.pushState(search, "", search);
	}
	
	function updateFromURL(urlSearch) {
		if (!urlSearch)
			urlSearch = window.location.search;
	
		if (urlSearch.length <= 1)
			return;
		
		if (updatingFromURL)
			return;
		
		updatingFromURL = true;
		
		var urlAssignments = urlSearch.substring(1).split('&');
		var filter = undefined;
		var tagsStr = undefined;
		for (var i = 0; i < urlAssignments.length; i++) {
			var assignment = urlAssignments[i].split('=');
			if (assignment[0] == 'filter') {
				filter = assignment[1];
			} else if (assignment[0] == 'tags') {
				tagsStr = assignment[1].replace(/%22/g,"\"");
			}
		}
		
		try {
			var selectedIds = messStore.getSelectedTagIds(true);
			for (var i = 0; i < selectedIds.length; i++)
				messStore.deselectTag(selectedIds[i]);
				
			var tagIds = JSON.parse(tagsStr);
			tagMenu.setFilterUser(filter);
			for (var i = 0; i < tagIds.length; i++)
				messStore.selectTag(tagIds[i]);
		} catch (error) {
		
		}
		
		updatingFromURL = false;
	}

	window.addEventListener("popstate", function (event){
		updateFromURL(event.state);
	});

	/* Update interface elements */

	function updateMouse() {
		var currentTime = Util.currentTimeInMillis();
		if (currentTime - messMouseMoveTime > that.MOUSE_MOVE_TIMEOUT)
			messControl.setFocusPoint(mousePosX, mousePosY, true);
	}
	
	function updateStatus() {
		return; // HACK: Don't show status for now
	
		if (typeof Util.error !== "undefined") {
			statusElement.innerHTML = '<span style="color: #FF0000;">' + Util.error + '</span>';
			return;
		}
		
		var storageStatusValue = '';
		
		var unsavedVerts = messControl.getUnsavedVerts();
		var unsavedEdges = messControl.getUnsavedEdges();
		var unsavedTags = messStore.getUnsavedTags();
		var savingVerts = messControl.getSavingVerts();
		var savingEdges = messControl.getSavingEdges();
		var savingTags = messStore.getSavingTags();
		var errorVerts = messControl.getErrorVerts();
		var errorEdges = messControl.getErrorEdges();
		var errorTags = messStore.getErrorTags();
		
		var retrievalState = messStore.getRetrievalState();
	
		var hasUnsavedVerts = unsavedVerts.length > 0;
		var hasUnsavedEdges = unsavedEdges.length > 0;
		var hasUnsavedTags = unsavedTags.length > 0;
		var hasSavingVerts = savingVerts.length > 0;
		var hasSavingEdges = savingEdges.length > 0;
		var hasSavingTags = savingTags.length > 0;
		var hasErrorVerts = errorVerts.length > 0;
		var hasErrorEdges = errorEdges.length > 0;
		var hasErrorTags = errorTags.length > 0;
	
		if (!hasUnsavedVerts && !hasUnsavedEdges && !hasSavingVerts && !hasSavingEdges) {
			storageStatusValue += '<span style="color: #00FF00;"><b>Storage Status: </b> :)';
		} else if (hasUnsavedVerts || hasUnsavedEdges) {
			storageStatusValue += '<span style="color: #FF0000;"><b>Storage Status: </b>:(';
		} else {
			storageStatusValue += '<span style="color: #FFFF00;"><b>Storage Status: </b>:|';		
		}
		
		if (hasUnsavedVerts) {
			storageStatusValue += ' Unsaved Dots:';
			for (var i = 0; i < unsavedVerts.length; i++) {
				if (i > 2) {
					storageStatusValue += '...';
					break;
				}
				storageStatusValue += ' ' + unsavedVerts[i];
			}
		}
		
		if (hasUnsavedEdges) {
			storageStatusValue += ' Unsaved Lines:'
			for (var i = 0; i < unsavedEdges.length; i++) {
				if (i > 2) {
					storageStatusValue += '...';
					break;
				}	
				
				storageStatusValue += '{' + unsavedEdges[i].id1 + ',' + unsavedEdges[i].id2 + '}';
			}
		}
		
		/*if (hasUnsavedTags) {
			storageStatusValue += ' Unsaved Tags:'
			for (var i = 0; i < unsavedTags.length; i++) {
				if (i > 2) {
					storageStatusValue += '...';
					break;
				}	
				
				storageStatusValue += ' ' + unsavedTags[i];
			}
		}*/
		
		if (hasSavingVerts) {
			storageStatusValue += ' Saving Dots:';
			for (var i = 0; i < savingVerts.length; i++) {
				if (i > 2) {
					storageStatusValue += '...';
					break;
				}
				storageStatusValue += ' ' + savingVerts[i];
			}
		}
		
		if (hasSavingEdges) {
			storageStatusValue += ' Saving Lines:'
			for (var i = 0; i < savingEdges.length; i++) {
				if (i > 2) {
					storageStatusValue += '...';
					break;
				}	
				
				storageStatusValue += '{' + savingEdges[i].id1 + ',' + savingEdges[i].id2 + '}';
			}
		}
		
		/*if (hasSavingTags) {
			storageStatusValue += ' Saving Tags:'
			for (var i = 0; i < savingTags.length; i++) {
				if (i > 2) {
					storageStatusValue += '...';
					break;
				}	
				
				storageStatusValue += ' ' + savingTags[i];
			}
		}*/
		
		/*if (hasErrorVerts) {
			storageStatusValue += ' Error Dots:';
			for (var i = 0; i < errorVerts.length; i++) {
				if (i > 2) {
					storageStatusValue += '...';
					break;
				}
				storageStatusValue += ' ' + errorVerts[i];
			}
		}
		
		if (hasErrorEdges) {
			storageStatusValue += ' Error Lines:'
			for (var i = 0; i < errorEdges.length; i++) {
				if (i > 2) {
					storageStatusValue += '...';
					break;
				}	
				
				storageStatusValue += '{' + errorEdges[i].id1 + ',' + errorEdges[i].id2 + '}';
			}
		}
		
		if (hasErrorTags) {
			storageStatusValue += ' Error Tags:'
			for (var i = 0; i < errorTags.length; i++) {
				if (i > 2) {
					storageStatusValue += '...';
					break;
				}	
				
				storageStatusValue += ' ' + errorTags[i];
			}
		}*/
		
		storageStatusValue += '</span>';
		
		var retrievalStatusValue = '';
		
		if (retrievalState == messStore.RETRIEVAL_STATE_NONE) {
			retrievalStatusValue += '<span style="color: #00FF00;"><b>Retrieval Status: </b> :) </span>';
		} else if (retrievalState == messStore.RETRIEVAL_STATE_GRAPH) {
			retrievalStatusValue += '<span style="color: #FFFF00;"><b>Retrieval Status: </b> :| </span>';
		} else if (retrievalState == messStore.RETRIEVAL_STATE_SKIPPED) {
			retrievalStatusValue += '<span style="color: #FF0000;"><b>Retrieval Status: </b> :( Skipped.  Trying again soon... </span>';
		}
		
		
		statusElement.innerHTML = storageStatusValue + '<br />' + retrievalStatusValue;
	}
	
	function updateContent() {
		var focusContent = messControl.getFocusContentThorough();
		//var focusColor = messControl.getFocusColor();  Possibly add back in later.
		
		if (!focusContent) {
			showContentElement.innerHTML = '';
		} else {
			var visibleContent = focusContent.substring(focusContent.indexOf("<br />"), focusContent.length);
			showContentElement.innerHTML = visibleContent;
		}
	}
	
	function updateEditContent(noLabel) {
		var messEditing = messControl.isEditingFocus();
		
		if (!messEditing && editingContent) {
			editContentElement.innerHTML = '';
			editContentElement.style.display = 'none';
			editLabelElement.innerHTML = '';
			editLabelElement.style.visibility = 'hidden';
			submitEditElement.style.display = 'none';
			messOverlayElement.focus();
			editingContent = false;
		} else if (messEditing && !editingContent) {
			var thorough = messControl.getEditFocusContentThorough();
			var brief = messControl.getEditFocusContentBrief();
			
			editContentElement.innerHTML = (thorough) ? thorough : '';
			editContentElement.style.display = 'inline';
			submitEditElement.style.display = 'inline';
			editingContent = true;
			
			if (!noLabel) {
				editLabelElement.innerHTML = (brief) ? brief : '';
				editLabelElement.style.visibility = 'visible';
				editLabelElement.focus();
			}
		}
	}
	
	/* Instructions */
	
	function toggleInstructions() {
		if (instructionsElement.style.display == 'none')
			instructionsElement.style.display = 'inline';
		else
			instructionsElement.style.display = 'none';
	}	
	
	/* Import/Export */
	
	function importMessFromJSON() {
		var importWindowContent = "<!DOCTYPE HTML PUBLIC '-//W3C//DTD HTML 4.01 Transitional//EN' 'http://www.w3.org/TR/html4/loose.dtd'>\n" +
								  "<html>\n" +
								  "<head>\n" +
								  "<title>The Mess - Import From JSON</title>\n" +
								  "<link href=\"styles/importExport.css\" rel=\"stylesheet\" type=\"text/css\"/>\n" + 
								  "</head>\n" +
								  "<body>\n" +
								  "<div id=\"importBody\">\n" + 
								  "<div id=\"importText\" contenteditable=\"true\"></div>\n" +
								  "<input type=\"text\" id=\"importSubmit\" value=\"Submit\"></input>\n" +
								  "</div>" +
								  "</body>\n" +
								  "</html>";
								  
		importWindow = window.open('','','menubar=no,width=' + that.IMPORT_EXPORT_WIDTH + ',height=' + that.IMPORT_EXPORT_HEIGHT + ',toolbar=no');		
		importWindow.document.write(importWindowContent);
		importWindow.document.getElementById('importSubmit').onclick = function() {
			messControl.fromJSONString(importWindow.document.getElementById('importText').innerHTML);
			importWindow.close();
		};
		
		importWindow.focus();
	}
	
	function exportMessAsArgument() {
		var exportWindowContent = "<!DOCTYPE HTML PUBLIC '-//W3C//DTD HTML 4.01 Transitional//EN' 'http://www.w3.org/TR/html4/loose.dtd'>\n" +
								  "<html>\n" +
								  "<head>\n" +
								  "<title>The Mess - Export As Argument</title>\n" +
								  "<link href=\"styles/importExport.css\" rel=\"stylesheet\" type=\"text/css\"/>\n" + 
								  "</head>\n" +
								  "<body></body>\n" +
								  "</html>";
		var messStr = messControl.toArgumentString();
		
		exportWindow = window.open('','','menubar=no,width=' + that.IMPORT_EXPORT_WIDTH + ',height=' + that.IMPORT_EXPORT_HEIGHT + ',toolbar=no');		
		exportWindow.document.write(exportWindowContent);
		exportWindow.document.body.innerHTML=messStr;
		exportWindow.focus();
	}
	
	function exportMessAsJSON() {
		var exportWindowContent = "<!DOCTYPE HTML PUBLIC '-//W3C//DTD HTML 4.01 Transitional//EN' 'http://www.w3.org/TR/html4/loose.dtd'>\n" +
								  "<html>\n" +
								  "<head>\n" +
								  "<title>The Mess - Export As JSON</title>\n" +
								  "<link href=\"styles/importExport.css\" rel=\"stylesheet\" type=\"text/css\"/>\n" + 
								  "</head>\n" +
								  "<body></body>\n" +
								  "</html>";
		var messStr = messControl.toJSONString();
		
		exportWindow = window.open('','','menubar=no,width=' + that.IMPORT_EXPORT_WIDTH + ',height=' + that.IMPORT_EXPORT_HEIGHT + ',toolbar=no');		
		exportWindow.document.write(exportWindowContent);
		exportWindow.document.body.innerHTML=messStr;
		exportWindow.focus();
	}
	
	/* Queries */
	
	function runQuery() {
		var importWindowContent = "<!DOCTYPE HTML PUBLIC '-//W3C//DTD HTML 4.01 Transitional//EN' 'http://www.w3.org/TR/html4/loose.dtd'>\n" +
								  "<html>\n" +
								  "<head>\n" +
								  "<title>The Corporate Mess - Run Query</title>\n" +
								  "<link href=\"styles/importExport.css\" rel=\"stylesheet\" type=\"text/css\"/>\n" + 
								  "</head>\n" +
								  "<body>\n" +
								  "<div id=\"importBody\">\n" + 
								  "<div id=\"importText\" contenteditable=\"true\"></div>\n" +
								  "<input type=\"text\" id=\"importSubmit\" value=\"Run\"></input>\n" +
								  "</div>" +
								  "</body>\n" +
								  "</html>";
								  
		importWindow = window.open('','','menubar=no,width=' + that.IMPORT_EXPORT_WIDTH + ',height=' + that.IMPORT_EXPORT_HEIGHT + ',toolbar=no');		
		importWindow.document.write(importWindowContent);
		importWindow.document.getElementById('importSubmit').onclick = function() {
			try {
				var queryStr = importWindow.document.getElementById('importText').innerHTML.trim().replace(/&nbsp;/g,"");
				var queryObj = JSON.parse(queryStr);
				
				tagMenu.setFilterUser(queryObj.filter, true);
				var tagNames = [];
				for (var i = 0; i < queryObj.organizations.length; i++) {
					// Upper case first letter, replace _ with space
					var name = queryObj.organizations[i];
					if (name.length == 0)
						continue;
					var newName = "";
					var nameParts = name.split("_");
					for (var j = 0; j < nameParts.length; j++) {
						newName += nameParts[j].charAt(0).toUpperCase();
						if (nameParts[j].length > 1)
							newName += nameParts[j].substring(1);
						newName += " ";
					}
					
					newName = newName.trim();
					tagNames.push(newName);
				}
				
				tagMenu.selectTagNames(tagNames);
			} catch(error) {
			
			}
			importWindow.close();
		};
		
		importWindow.focus();
	}
	
	function generateQuery() {
		var exportWindowContent = "<!DOCTYPE HTML PUBLIC '-//W3C//DTD HTML 4.01 Transitional//EN' 'http://www.w3.org/TR/html4/loose.dtd'>\n" +
								  "<html>\n" +
								  "<head>\n" +
								  "<title>The Corporate Mess - Query</title>\n" +
								  "<link href=\"styles/importExport.css\" rel=\"stylesheet\" type=\"text/css\"/>\n" + 
								  "</head>\n" +
								  "<body>" +
								  "<div id=\"importBody\">\n" + 
								  "<div id=\"importText\" contenteditable=\"true\"></div>\n" +
								  "</div>" +
								  "</body>\n" +
								  "</html>";
		var tagNames = tagMenu.getSelectedTagNames();
		var filter = tagMenu.getFilterUser();
		
		for (var i = 0; i < tagNames.length; i++) {
			tagNames[i] = tagNames[i].toLowerCase();
			tagNames[i] = tagNames[i].replace(/ /g, "_");
		}
		
		exportWindow = window.open('','','menubar=no,width=' + that.IMPORT_EXPORT_WIDTH + ',height=' + that.IMPORT_EXPORT_HEIGHT + ',toolbar=no');		
		exportWindow.document.write(exportWindowContent);
		exportWindow.document.getElementById("importText").innerHTML=JSON.stringify({filter : filter, organizations : tagNames});
		exportWindow.focus()
	}
	
	/* Mouse event handling */
	
	function messMouseMove(event) {
		event.preventDefault();
		messMouseMoveTime = Util.currentTimeInMillis();
		mousePosX = event.layerX;
		mousePosY = event.layerY;
		messControl.setFocusPoint(mousePosX, mousePosY, false);
	}

	function messMouseDown(event) {
		event.preventDefault();
		messControl.selectFocusPoint(event.layerX, event.layerY);
		messMouseDownTime = Util.currentTimeInMillis();
	} 

	function messMouseUp(event) {
		event.preventDefault();
		var currentTime = Util.currentTimeInMillis();
		
		messControl.deselectFocusPoint(event.layerX, event.layerY, currentTime - messMouseDownTime < that.SINGLE_CLICK_TIMEOUT);
		
		if (currentTime - messMouseUpTime < that.DOUBLE_CLICK_TIMEOUT)
			messDoubleClick(event);
			
		messMouseUpTime = Util.currentTimeInMillis();
	} 
	
	function messDoubleClick(event) {
		messControl.enterFocusPoint(event.layerX, event.layerY);
	}
	
	/* Keyboard event handling.  Uses external library for shortcuts.  Replace
	 * this later
	 */
	/*
	shortcut.add(this.KEYBOARD_TOGGLE_INSTRUCTIONS,
	toggleInstructions,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});
	 
	shortcut.add(this.KEYBOARD_SAVE_THE_MESS,
	messStore.save,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});
	 
	shortcut.add(this.KEYBOARD_EDIT_VERT,
	messControl.editFocus,
	{
		'type':'keyup',
		'disable_in_input': false,
		'propagate': false,
		'target':document
	});
	 
	shortcut.add(this.KEYBOARD_ADD_VERT,
	messControl.addVert,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});	
	
	shortcut.add(this.KEYBOARD_REMOVE_VERTS,
	messControl.removeVerts,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});

	shortcut.add(this.KEYBOARD_TOGGLE_MAIN_VERTS,
	messControl.toggleMainVerts,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});
	
	shortcut.add(this.KEYBOARD_ADD_EDGES,
	messControl.addEdges,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});
	
	shortcut.add(this.KEYBOARD_REMOVE_EDGES,
	messControl.removeEdges,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});
	
	shortcut.add(this.KEYBOARD_DIRECTION_EDGES,
	messControl.directionEdges,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});
	
	shortcut.add(this.KEYBOARD_TYPE_EDGES,
	messControl.typeEdges,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});
	
	shortcut.add(this.KEYBOARD_GROUP_EDGES,
	messControl.groupEdges,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});
	
	shortcut.add(this.KEYBOARD_SELECT_VERTS,
	messControl.selectVerts,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});
	
	shortcut.add(this.KEYBOARD_DESELECT_VERTS,
	messControl.deselectVerts,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});
	 */
	shortcut.add(this.KEYBOARD_SCROLL_LEFT,
	messControl.setMovementLeftOn,
	{
		'type':'keydown',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});	
	
	shortcut.add(this.KEYBOARD_SCROLL_LEFT,
	messControl.setMovementLeftOff,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});

	shortcut.add(this.KEYBOARD_SCROLL_RIGHT,
	messControl.setMovementRightOn,
	{
		'type':'keydown',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});	
	
	shortcut.add(this.KEYBOARD_SCROLL_RIGHT,
	messControl.setMovementRightOff,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});	

	shortcut.add(this.KEYBOARD_SCROLL_UP,
	messControl.setMovementUpOn,
	{
		'type':'keydown',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});	
	
	shortcut.add(this.KEYBOARD_SCROLL_UP,
	messControl.setMovementUpOff,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});	
	
	shortcut.add(this.KEYBOARD_SCROLL_DOWN,
	messControl.setMovementDownOn,
	{
		'type':'keydown',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});	
	
	shortcut.add(this.KEYBOARD_SCROLL_DOWN,
	messControl.setMovementDownOff,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});	
	/*
	shortcut.add(this.KEYBOARD_UNDO,
	messControl.undo,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});		

	shortcut.add(this.KEYBOARD_SHRINK_HIGHLIGHT,
	messControl.shrinkHighlight,
	{
		'type':'keypdown',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});	
	
	shortcut.add(this.KEYBOARD_APPEND_HIGHLIGHT_0,
	messControl.appendHighlight0,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});		
	
	shortcut.add(this.KEYBOARD_APPEND_HIGHLIGHT_1,
	messControl.appendHighlight1,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});		
	
	shortcut.add(this.KEYBOARD_APPEND_HIGHLIGHT_2,
	messControl.appendHighlight2,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});	
	
	shortcut.add(this.KEYBOARD_APPEND_HIGHLIGHT_3,
	messControl.appendHighlight3,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});	
	
	shortcut.add(this.KEYBOARD_APPEND_HIGHLIGHT_4,
	messControl.appendHighlight4,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});	

	shortcut.add(this.KEYBOARD_APPEND_HIGHLIGHT_5,
	messControl.appendHighlight5,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});
	
	shortcut.add(this.KEYBOARD_APPEND_HIGHLIGHT_6,
	messControl.appendHighlight6,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});
	
	shortcut.add(this.KEYBOARD_APPEND_HIGHLIGHT_7,
	messControl.appendHighlight7,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});
	
	shortcut.add(this.KEYBOARD_APPEND_HIGHLIGHT_8,
	messControl.appendHighlight8,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});
	
	shortcut.add(this.KEYBOARD_APPEND_HIGHLIGHT_9,
	messControl.appendHighlight9,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});
	
	shortcut.add(this.KEYBOARD_APPEND_HIGHLIGHT_DOT,
	messControl.appendHighlightDot,
	{
		'type':'keyup',
		'disable_in_input': true,
		'propagate': false,
		'target':document
	});
	*/
}