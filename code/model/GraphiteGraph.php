<?php

class GraphiteGraph extends ViewableData {
	protected $graphite;

	function __construct($graphite) {
		$this->graphite = $graphite;	
	}

	function Graph($width = null, $height = null) {
		$this->graphite->setTime('1h');
		$this->graphite->setBaseURL(Director::absoluteURL('graphite/'));
		return $this->graphite->getDashboardHTML($width, $height);
	}
}