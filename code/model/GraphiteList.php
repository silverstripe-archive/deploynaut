<?php

require_once(BASE_PATH . '/dashboard/dashboard-helpers.php');

class GraphiteList extends ArrayList {

	function __construct($servers = array(), $metricList = null) {
		parent::__construct();

		if($metricList === null) {
			$metricList = array("Apache", "Load average", "CPU Usage", "Memory Free", "Physical Memory Used", "Swapping"/*, "APC"*/);
		}

		foreach($servers as $server) {
			$serverName = substr($server,strrpos($server,'.')+1);

			$graphs = getCommonGraphs(
				$metricList,
				array("server" => $server, 'title_prefix' => $serverName . ' - ')
			);
			foreach($graphs as $graph) {
				$this->push(new GraphiteGraph($graph));
			}
		}
	}

}