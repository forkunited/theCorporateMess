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
function DropDownMenu(titleContainer, bodyContainer, id, title, selectable) {
	var that = this;  
	
	this.DOM_TITLE_CLASS = 'dropDownMenuTitle';
	this.DOM_TITLE_MOUSEOVER_CLASS = 'dropDownMenuTitleMouseover';
	this.DOM_BODY_CLASS = 'dropDownMenuBody';
	this.DOM_LINK_CLASS = 'dropDownMenuLink';
	this.DOM_LINK_SELECTED_CLASS = 'dropDownMenuLinkSelected';
	this.DOM_LINK_MOUSEOVER_CLASS = 'dropDownMenuLinkMouseover';
	
	var titleElement = document.createElement('div');
	var bodyElement = document.createElement('div');

	titleElement.setAttribute('class', that.DOM_TITLE_CLASS);
	bodyElement.setAttribute('class', that.DOM_BODY_CLASS);
	
	titleElement.setAttribute('id', that.DOM_TITLE_CLASS + '_' + id);
	bodyElement.setAttribute('id', that.DOM_BODY_CLASS + '_' + id);
	
	titleElement.onmouseover = function() { bodyContainer.style.display = 'inline'; bodyElement.style.visibility = 'visible'; titleElement.setAttribute('class', that.DOM_TITLE_MOUSEOVER_CLASS);};
	titleElement.onmouseout = function() { bodyContainer.style.display = 'none'; bodyElement.style.visibility = 'hidden'; titleElement.setAttribute('class', that.DOM_TITLE_CLASS); };
	bodyElement.onmouseover = function() { bodyContainer.style.display = 'inline'; bodyElement.style.visibility = 'visible'; };
	bodyElement.onmouseout = function() { bodyContainer.style.display = 'none'; bodyElement.style.visibility = 'hidden'; };
	
	titleElement.innerHTML = title;

	titleContainer.appendChild(titleElement);
	bodyContainer.appendChild(bodyElement);
	
	this.addLink = function(id, title, clickFn) {
		var linkElement = document.createElement('div');
		linkElement.setAttribute('class', that.DOM_LINK_CLASS);
		linkElement.setAttribute('id', that.DOM_LINK_CLASS + '_' + id);

		if (!selectable) {
			linkElement.onclick = clickFn;
		} else {
			if (bodyElement.childNodes.length == 0)
				linkElement.setAttribute('class', that.DOM_LINK_SELECTED_CLASS);
				
			linkElement.onclick = function() {
				for (var i = 0; i  < bodyElement.childNodes.length; i++) {
					bodyElement.childNodes[i].setAttribute('class', that.DOM_LINK_CLASS);
				}
				linkElement.setAttribute('class', that.DOM_LINK_SELECTED_CLASS);
				clickFn();
			}
		}
		
		linkElement.onmouseover = function() { if (linkElement.getAttribute('class') != that.DOM_LINK_SELECTED_CLASS) linkElement.setAttribute('class', that.DOM_LINK_MOUSEOVER_CLASS); };
		linkElement.onmouseout = function() { if (linkElement.getAttribute('class') != that.DOM_LINK_SELECTED_CLASS) linkElement.setAttribute('class', that.DOM_LINK_CLASS); };
	
		linkElement.innerHTML = title;
	
		bodyElement.appendChild(linkElement);
	}
}