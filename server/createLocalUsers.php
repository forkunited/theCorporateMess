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
 
exit(0);
 
require_once('auth.php');

require_once("phar://lib/neo4jphp.phar");
require_once('./classes/User.php');

User::create('FULL');
User::create('1990');
User::create('1991');
User::create('1992');
User::create('1993');
User::create('1994');
User::create('1995');
User::create('1996');
User::create('1997');
User::create('1998');
User::create('1999');
User::create('2000');
User::create('2001');
User::create('2002');
User::create('2003');
User::create('2004');
User::create('2005');
User::create('2006');
User::create('2007');
User::create('2008');
User::create('2009');
User::create('2010');
User::create('2011');
User::create('2012');
User::create('Default');

echo 'Done.';

?>