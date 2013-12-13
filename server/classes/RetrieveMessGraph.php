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
require_once("Visibility.php");
require_once("MessTag.php");
require_once("MessGraph.php");

use Everyman\Neo4j\Client,
	Everyman\Neo4j\Index\NodeIndex,
	Everyman\Neo4j\Node,
	Everyman\Neo4j\Batch,
	Everyman\Neo4j\Cypher\Query;

class RetrieveMessGraph
{
	const GraphAllByTags = "graphAllByTags";
	const TagsByNamesAndUser = "tagsByNamesAndUser";
	const TagsAllByUser = "tagsAllByUser";
	const TagsRecentlyUpdated = "tagsRecentlyUpdated";
	const TagsSearchByUser = "tagsSearchByUser";
	const TagsSearch = "tagsSearch";

	private $__client;
	private $__user;

	public function __construct($user)
	{
		$this->__client = new Client();
		$this->__user = $user;
	}
	
	public function run($queryType, $params)
	{
		switch ($queryType)
		{
			case RetrieveMessGraph::GraphAllByTags: return $this->graphAllByTags($params->{'tagIds'}, $params->{'minUpdatedDates'}, $params->{'compactionDates'});
			case RetrieveMessGraph::TagsByNamesAndUser: return $this->tagsByNamesAndUser(new User($params->{'user'}), $params->{'tagNames'});
			case RetrieveMessGraph::TagsAllByUser: return $this->tagsAllByUser(new User($params->{'user'}), $params->{'skip'}, $params->{'limit'});
			case RetrieveMessGraph::TagsRecentlyUpdated: return $this->tagsRecentlyUpdated($params->{'skip'}, $params->{'limit'});
			case RetrieveMessGraph::TagsSearchByUser: return $this->tagsSearchByUser(new User($params->{'user'}), $params->{'search'}, $params->{'skips'}, $params->{'limit'});
			case RetrieveMessGraph::TagsSearch: return $this->tagsSearch($params->{'search'}, $params->{'skips'}, $params->{'limit'});
			default: return null;
		}
	}
	
	public function __get($var)
	{
		return $this->{$var};
	}
	
	/*
	 * Subgraph queries (search through subgraphs)
	 */
	
	public function graphAllByTags($tagIds, $minUpdatedDates, $compactionDates)
	{
		$graph = new MessGraph();
		for ($i = 0; $i < count($tagIds); $i++) 
		{
			$tag = null;
			if ($graph->hasTag($tagIds[$i]))
				$tag = $graph->getTag($tagIds[$i]);
			else
				$tag = new MessTag($this->__user, $tagIds[$i]);
				
			if (!$tag->retrieveGraph($graph, $minUpdatedDates[$i], $compactionDates[$i]))
			{
				return null;
			}
		}
		
		return $graph;
	}
	
	/*
	 * Tag queries (searching for tags)
	 */
	
	public function tagsByNamesAndUser($user, $tagNames) 
	{
		$queryStr = "START u=node:exactUser(id={userId}),c=node:exactUser(id={currentUserId}),t=node:exactTag(name={tagName}) " .
					"MATCH (u)-[:USER_CREATED_TAG]->(t)<-[ct?:USER_CREATED_TAG|USER_RECEIVED_TAG]-(c) " .
					"WHERE " .
					"t.visibility = " . Visibility::All . " " .
					"OR (t.visibility = " . Visibility::Some . " AND ct IS NOT NULL) " .
					"OR (t.visibility = " . Visibility::None . " AND ct IS NOT NULL AND TYPE(ct) = 'USER_CREATED_TAG') " .
					"RETURN ct, t";
		
		$queries = array();
		$skips = array();
		$extraParameters = array();
		
		for ($i = 0; $i < count($tagNames); $i++) 
		{
			$queries[$i] = $queryStr;
			$skips[$i] = 0;
			$extraParameters[$i] = array('userId' => $user->id, 'tagName' => $tagNames[$i]);
		}
		
		return $this->runTagQueries($queries, $skips, 0, $extraParameters);
	}
	
	public function tagsAllByUser($user, $skip = 0, $limit = 0)
	{
		$queries = array(
					 0 => "START u=node:exactUser(id={userId}),c=node:exactUser(id={currentUserId}) " .
						  "MATCH (u)-[:USER_CREATED_TAG]->(t)<-[ct?:USER_CREATED_TAG|USER_RECEIVED_TAG]-(c) " .
						  "WHERE " .
						  "	t.visibility = " . Visibility::All . " " .
						  "	OR (t.visibility = " . Visibility::Some . " AND ct IS NOT NULL) " .
						  "	OR (t.visibility = " . Visibility::None . " AND ct IS NOT NULL AND TYPE(ct) = 'USER_CREATED_TAG') " .
						  "RETURN ct, t " . 
						  "ORDER BY t._updatedDate DESC " .
						  (($skip == 0) ? " " : "SKIP {skipValue} ") . 
						  (($limit == 0) ? " " : "LIMIT {limitValue}")
					);
		$skips = array(0 => $skip);
		$extraParameters = array('userId' => $user->id);
		
		return $this->runTagQueries($queries, $skips, $limit, $extraParameters);
	}
	
	public function tagsRecentlyUpdated($skip = 0, $limit = 0) 
	{
		$queries = array(
					0 =>  "START t=node:exactTag(_recentlyUpdated='true'), c=node:exactUser(id={currentUserId}) " .
						  "MATCH (t)<-[ct?:USER_CREATED_TAG|USER_RECEIVED_TAG]-(c) " .
						  "WHERE " .
						  "	t.visibility = " . Visibility::All . " " .
						  "	OR (t.visibility = " . Visibility::Some . " AND ct IS NOT NULL) " .
						  "	OR (t.visibility = " . Visibility::None . " AND ct IS NOT NULL AND TYPE(ct) = 'USER_CREATED_TAG') " .
						  "RETURN ct, t " . 
						  "ORDER BY t._updatedDate DESC " .
						  (($skip == 0) ? " " : "SKIP {skipValue} ") . 
						  (($limit == 0) ? " " : "LIMIT {limitValue}")
					);
		$skips = array(0 => $skip);
		
		return $this->runTagQueries($queries, $skips, $limit);
	}
	
	public function tagsSearchByUser($user, $search, $skips, $limit = 10) 
	{
		if (count($skips) == 0)
			$skips = array(0,0);
	
		$queries = array(
					0 =>  "START t=node:fulltextTag({searchQuery0}),u=node:exactUser(id={userId}),c=node:exactUser(id={currentUserId}) " .
						  "MATCH (u)-[:USER_CREATED_TAG]->(t)<-[ct?:USER_CREATED_TAG|USER_RECEIVED_TAG]-(c) " .
						  "WHERE " .
						  "	t.visibility = " . Visibility::All . " " .
						  "	OR (t.visibility = " . Visibility::Some . " AND ct IS NOT NULL) " .
						  "	OR (t.visibility = " . Visibility::None . " AND ct IS NOT NULL AND TYPE(ct) = 'USER_CREATED_TAG') " .
						  "RETURN ct, t " . 
						  "ORDER BY t._updatedDate DESC " .
						  (($skips[0] == 0) ? " " : "SKIP {skipValue} ") . 
						  (($limit == 0) ? " " : "LIMIT {limitValue}"),
					1 =>  "START n=node:fulltextNode({searchQuery1}),u=node:exactUser(id={userId}),c=node:exactUser(id={currentUserId}) " .
						  "MATCH (u)-[:USER_CREATED_TAG]->(t)<-[ct?:USER_CREATED_TAG|USER_RECEIVED_TAG]-(c),(t)-[:TAG_TAGGED_NODE]->(n) " .
						  "WHERE " .
						  "	t.visibility = " . Visibility::All . " " .
						  "	OR (t.visibility = " . Visibility::Some . " AND ct IS NOT NULL) " .
						  "	OR (t.visibility = " . Visibility::None . " AND ct IS NOT NULL AND TYPE(ct) = 'USER_CREATED_TAG') " .
						  "RETURN ct, t " . 
						  "ORDER BY t._updatedDate DESC " .
						  (($skips[1] == 0) ? " " : "SKIP {skipValue} ") . 
						  (($limit == 0) ? " " : "LIMIT {limitValue}")
					);	
		$extraParameters = array('userId' => $user->id,
								 'searchQuery0' => 'name:"' . $search . '" OR _creator:"' . $search . '"',
								 'searchQuery1' => 'brief:"' . $search . '" OR thorough:"' . $search . '"');
	
		return $this->runTagQueries($queries, $skips, $limit, $extraParameters);
	}
	
	public function tagsSearch($search, $skips, $limit = 10) 
	{
		if (count($skips) == 0)
			$skips = array(0,0);
	
		$queries = array(
					0 =>  "START t=node:fulltextTag({searchQuery0}),c=node:exactUser(id={currentUserId}) " .
						  "MATCH (t)<-[ct?:USER_CREATED_TAG|USER_RECEIVED_TAG]-(c) " .
						  "WHERE " .
						  "	t.visibility = " . Visibility::All . " " .
						  "	OR (t.visibility = " . Visibility::Some . " AND ct IS NOT NULL) " .
						  "	OR (t.visibility = " . Visibility::None . " AND ct IS NOT NULL AND TYPE(ct) = 'USER_CREATED_TAG') " .
						  "RETURN ct, t " . 
						  "ORDER BY t._updatedDate DESC " .
						  (($skips[0] == 0) ? " " : "SKIP {skipValue} ") . 
						  (($limit == 0) ? " " : "LIMIT {limitValue}"),
					1 =>  "START n=node:fulltextNode({searchQuery1}),c=node:exactUser(id={currentUserId}) " .
						  "MATCH (n)<-[:TAG_TAGGED_NODE]-(t)<-[ct?:USER_CREATED_TAG|USER_RECEIVED_TAG]-(c) " .
						  "WHERE " .
						  "	t.visibility = " . Visibility::All . " " .
						  "	OR (t.visibility = " . Visibility::Some . " AND ct IS NOT NULL) " .
						  "	OR (t.visibility = " . Visibility::None . " AND ct IS NOT NULL AND TYPE(ct) = 'USER_CREATED_TAG') " .
						  "RETURN ct, t " . 
						  "ORDER BY t._updatedDate DESC " .
						  (($skips[1] == 0) ? " " : "SKIP {skipValue} ") . 
						  (($limit == 0) ? " " : "LIMIT {limitValue}")
					);	
		$extraParameters = array('searchQuery0' => 'name:"' . $search . '" OR _creator:"' . $search . '"',
								 'searchQuery1' => 'brief:"' . $search . '" OR thorough:"' . $search . '"');
					
		return $this->runTagQueries($queries, $skips, $limit, $extraParameters);
	}
	
	private function runTagQueries($queries, $skips, $limit, $extraParameters = null) 
	{
		try
		{
			$graph = new MessGraph();
		
			$numQueries = count($queries);
			$parameters = array();
			
			if ($extraParameters != null) 
			{
				foreach ($extraParameters as $name => $value) 
				{
					$parameters[$name] = $value;
				}
			}
			$parameters["limitValue"] = $limit + 1;  // Limit to one extra to check to see if there are more results after the returned
			$parameters["currentUserId"] = $this->__user->id;
			
			$results = array();
			$totalResultsCount = 0;
			foreach ($queries as $id => $queryStr)
			{
				$parameters["skipValue"] = $skips[$id];
				$query = new Query($this->__client, $queryStr, $parameters);
				$results[$id] = $query->getResultSet();
				$totalResultsCount += $results[$id]->count();
			}
			
			$metaData = array(
				"remainder" => true,
				"nextSkips" => array_fill(0, $numQueries, 0)
			);
			
			if ($limit == 0)
				$limit = $totalResultsCount;
			
			for ($i = 0; $i < $limit; $i++) 
			{
				$maxUpdatedDateQuery = -1;
				for ($j = 0; $j < $numQueries; $j++)
				{
					while ($metaData["nextSkips"][$j] < $results[$j]->count() &&
						   $graph->hasTag($results[$j][$metaData["nextSkips"][$j]]["t"]->getProperty("id"))) {
						$metaData["nextSkips"][$j]++;		
					}
				
					if ($metaData["nextSkips"][$j] < $results[$j]->count() && 
							($maxUpdatedDateQuery < 0 || 
							 $results[$maxUpdatedDateQuery][$metaData["nextSkips"][$maxUpdatedDateQuery]]["t"]->getProperty("_updatedDate") < $results[$j][$metaData["nextSkips"][$j]]["t"]->getProperty("_updatedDate"))
						) 
					{
						$maxUpdatedDateQuery = $j;
					}
				}
				
				if ($maxUpdatedDateQuery < 0) 
				{
					$metaData["remainder"] = false;
					break;
				}
				
				$row = $results[$maxUpdatedDateQuery][$metaData["nextSkips"][$maxUpdatedDateQuery]];
				$tag = new MessTag($this->__user, $row['t']->getProperty('id'), new User($row['t']->getProperty('_creator')), $row['t']->getProperty('name'), $row['t']->getProperty('visibility'), true, 
									$row['ct'] != null && $row['ct']->getType() == 'USER_CREATED_TAG');
				
				$tag->_compactionDate = $row['t']->getProperty('_compactionDate');
				$tag->_updatedDate = $row['t']->getProperty('_updatedDate');
				$tag->_nodeCount = $row['t']->getProperty('_nodeCount');
				
				
				$graph->addTag($tag);	
				$metaData["nextSkips"][$maxUpdatedDateQuery]++;
			}
			
			for ($i = 0; $i < $numQueries; $i++) {
				$metaData["nextSkips"][$i] += $skips[$i];
			}
			
			$graph->setMetaData($metaData);
			
			return $graph;
		}
		catch (Exception $e)
		{
			return null;
		}
	}
}

?>