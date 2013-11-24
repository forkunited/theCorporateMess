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

require_once("phar://lib/neo4jphp.phar");

use Everyman\Neo4j\Client;

abstract class MessObject
{	
	protected $__client;
	protected $__transaction;
	
	abstract public function retrieve();
	abstract public function update();
	abstract public function delete();
	abstract public function hasReadAccess();
	abstract public function hasWriteAccess();
	
	public function setTransaction(MessTransaction $transaction) {
		$this->__transaction = $transaction;
		$this->__client = $transaction->getClient();
	}
	
	public function setClient(Client $client)
	{
		$this->__client = $client;
	}
	
	protected function clientBegin()
	{
		$client = null;
		if ($this->__client != null)
			$client = $this->__client;
		else
		{
			$client = new Client();
			$client->startBatch();
		}
		
		return $client;
	}
	
	protected function clientEnd($client)
	{
		if ($this->__client == null)
			return $client->commitBatch();
		else
			return true;	
	}
}

?>