<?php

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

require_once('./server/auth.php');

?>
<!DOCTYPE HTML>
<html>
	<head>
		<title>The Corporate Mess</title>
		
		<!-- Style -->
		<link href="styles/main.css" rel="stylesheet" type="text/css"/>
		<link href="styles/ui.css" rel="stylesheet" type="text/css"/> 
		<link href="styles/tagSearchMenu.css" rel="stylesheet" type="text/css"/>
		<link href="styles/tagSearchMenuItem.css" rel="stylesheet" type="text/css"/>
		<link href="styles/tagEditMenu.css" rel="stylesheet" type="text/css"/>
		<link href="styles/dropDownMenu.css" rel="stylesheet" type="text/css"/>
		
		<!-- External libraries -->
		<script src="scripts/lib/shortcut.js" type="text/javascript"></script>
		
		<!-- Utilities -->
		<script src="scripts/Util.js" type="text/javascript"></script>
		<script src="scripts/RandomColors.js" type="text/javascript"></script>
		
		<!-- Storage and retrieval -->
		<script src="scripts/LocalStorageMessage.js" type="text/javascript"></script>
		<script src="scripts/StorageMessage.js" type="text/javascript"></script>
		<script src="scripts/StoreMessGraph.js" type="text/javascript"></script>
		<script src="scripts/RetrieveMessGraph.js" type="text/javascript"></script>
		<script src="scripts/RetrieveUsers.js" type="text/javascript"></script>
		
		<!-- Graph clustering -->
		<script src="scripts/GraphClustererWeakComponents.js" type="text/javascript"></script>
		<script src="scripts/GraphClustererProperties.js" type="text/javascript"></script>
		
		<!-- Graph visualization -->
		<script src="scripts/VisualSelection.js" type="text/javascript"></script>
		<script src="scripts/VisualVertex.js" type="text/javascript"></script>
		<script src="scripts/VisualEdge.js" type="text/javascript"></script>
		<script src="scripts/VisualHyperEdge.js" type="text/javascript"></script>
		<script src="scripts/VisualAnimationSprings.js" type="text/javascript"></script>
		<script src="scripts/VisualAnimationRadial.js" type="text/javascript"></script>		
		<script src="scripts/VisualGraph.js" type="text/javascript"></script>
		
		<!-- Drop down menus -->
		<script src="scripts/DropDownMenu.js" type="text/javascript"></script>
		
		<!-- Tag search menus -->
		<script src="scripts/TagSearchMenu.js" type="text/javascript"></script> 
		<script src="scripts/TagSearchMenuItem.js" type="text/javascript"></script> 	
		<script src="scripts/TagEditMenu.js" type="text/javascript"></script> 	
	
		<!-- Mess -->
		<script src="scripts/MessGraph.js" type="text/javascript"></script>
		<script src="scripts/MessHistory.js" type="text/javascript"></script>
		<script src="scripts/MessViewControl.js" type="text/javascript"></script> 
		<script src="scripts/MessStore.js" type="text/javascript"></script> 
		
		<!-- Main UI -->
		<script src="scripts/UI.js" type="text/javascript"></script> 
		
		<script type="text/javascript">
			window.onload = function() {
				var mess = new UI(document.getElementById('main'), '<?php echo $GLOBALS['User'] ?>');
				mess.construct();
			};
		</script>
	</head>
	<body>
		<div id="main">
		</div>
	</body>
</html>
