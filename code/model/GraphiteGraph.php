<?php

class GraphiteGraph extends ViewableData {
	protected $graphite;

	public function __construct($graphite) {
		$this->graphite = $graphite;
	}

	public function Graph($width = null, $height = null) {
		$this->graphite->setTime('1h');
		$this->graphite->setBaseURL(Director::absoluteURL('graphite/'));
		return $this->graphite->getDashboardHTML($width, $height);
	}
}
