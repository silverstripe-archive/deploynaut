<?php

require_once dirname(__FILE__) . '/lib/bootstrap.php';

/**
 * Get an array of all our datacentres
 */
function getDataCentres() {
	$rawList = json_decode(file_get_contents("http://graphite.silverstripe.com/render?from=-5min&target=server.*.*.loadavg.1min&format=json"), true);

	$datacentres = array();

	foreach($rawList as $list) {
		$datacentre = preg_replace('/\.[^.]*\.loadavg\.1min$/','',$list['target']);
		$datacentres[] = $datacentre;
	}
	return array_unique($datacentres);
}

/**
 * Get an array of all our servers
 */
function getServers() {
	$rawList = json_decode(file_get_contents("http://graphite.silverstripe.com/render?from=-5min&target=server.*.*.loadavg.1min&format=json"), true);

	$servers = array();

	foreach($rawList as $list) {
		$server = preg_replace('/\.loadavg\.1min$/','',$list['target']);
		$servers[] = $server;
	}
	return $servers;
}

/**
 * Return a nested array of servers, then sites.
 * servers will be "server.<network>.<host>" and sites will be a codename
 */
function getSites() {
	$rawList = json_decode(file_get_contents("http://graphite.silverstripe.com/render?from=-5min&target=server.*.*.apache.*.request.req_per_min&format=json"), true);

	$sites = array();

	foreach($rawList as $list) {
		$matches = null;
		if(preg_match('/^(server\.[^.]+\.[^.]+)\.apache\.([^.]+)\.request\.req_per_min$/',$list['target'], $matches)) {
			$server = str_replace('server.','',$matches[1]);
			$sites[$matches[1]][$matches[2]] = $matches[2] . " ($server)";
		} else {
			throw new Exception("Bad target '${list['target']}'");
		}
	}

	return $sites;
}

/**
 * Return an array of servers that have the given target metric
 * Eg: getServersWith("server.*.*.mysql.queries.select")
 * 
 * servers will be "server.<network>.<host>" and sites will be a codename
 */
function getServersWith($target) {
	$rawList = json_decode(file_get_contents("http://graphite.silverstripe.com/render?from=-5min&target=$target&format=json"), true);

	$sites = array();

	foreach($rawList as $list) {
		$matches = null;
		if(preg_match('/^(server\.[^.]+\.[^.]+)/',$list['target'], $matches)) {
			$servers[] = $matches[1];
		} else {
			throw new Exception("Bad target '${list['target']}'");
		}
	}

	return $servers;
}

function dataCentreDropdown($datacentres) {
	$dropdown = array("" => "All data-centres");
	foreach($datacentres as $item) {
		$dropdown[$item] = str_replace('server.','',$item);
	}
	return $dropdown;
}

function siteDropdown($serversAndSites) {
	$siteDropdown = array("" => "All sites");
	foreach($serversAndSites as $server => $sites) {
		foreach($sites as $site => $siteTitle) {
			$siteDropdown["$server/$site"] = $siteTitle;
		}
	}
	asort($siteDropdown);
	return $siteDropdown;
}

function serverDropdown($servers) {
	$serverDropdown = array("" => "All servers");
	foreach($servers as $server) {
		$serverDropdown[$server] = str_replace('server.','',$server);
	}
	return $serverDropdown;
}

function metricDropdown($graphs) {
	// Create metric dropdown
	$metricDropdown = array("" => "All metrics");
	foreach($graphs as $metric => $dummy) {
		$metricDropdown[$metric] = $metric;
	}
	return $metricDropdown;
}

/**
 * Return a number of common graphs in a map
 */
function getCommonGraphs($types, $params) {
	$graphs = array();
	foreach($types as $type) {
		$graphs[$type] = getCommonGraph($type, $params);
	}
	return $graphs;
}


/**
 * Return a common graph, defined here and shared across dashboards
 */
function getCommonGraph($type, $params = array()) {
	$title = isset($params['title']) ? $params['title'] : $type;
	if(isset($params['title_prefix'])) $title = $params['title_prefix'] . $title;
	if(isset($params['title_suffix'])) $title = $title . $params['title_suffix'];

	$base = $params['server'];
	$site = isset($params['site']) ? $params['site'] : null;

	$width = isset($params['width ']) ? $params['width '] : 380;
	$height = isset($params['height']) ? $params['height'] : 220;

	// Server
	switch(strtolower($type)) {
	case "apache":
		return Graphite::inst()
			->setTitle($title)
			->addMetric('alias(secondYAxis(divideSeries('.$base.'.memory.rss.apache,'.$base.'.apache.process-count)),"Memory per process")', '#0000ff')
			->addMetric('alias('.$base.'.apache.workers.busy,"Busy Workers")', '#00cc00')
			->addMetric('alias('.$base.'.apache.process-count,"All Workers")', '#cc00cc')
			->setSize($width, $height);

	case "mysql":
		return Graphite::inst()
				->setTitle($title)
				->addMetric('alias(derivative('.$base.'.mysql.queries.select),"Read Queries / min")')
				->addMetric('alias(secondYAxis(derivative(sumSeries('.$base.'.mysql.queries.update,'.$base.'.mysql.queries.delete,'.$base.'.mysql.queries.insert))),"Write Queries / min")')
				->setSize($width, $height);

	case "load average":
			return Graphite::inst()
			->setTitle($title)
			->addMetric('lineWidth(movingAverage('.$base.'.loadavg.1min,10),3)', '#dddddd')
			->addMetric($base.'.loadavg.1min', '#00cc00')
			->hideLegend(true)
			->setSize($width, $height);

	case "cpu usage":
		return Graphite::inst()
			->setTitle($title)
			->addMetric('alias(divideSeries(derivative('.$base.'.cpu.non-nice),derivative('.$base.'.cpu.total)),"User")', '#0000cc')
			->addMetric('alias(divideSeries(derivative('.$base.'.cpu.io-wait),derivative('.$base.'.cpu.total)),"I/O wait")', '#770000')
			->addMetric('alias(divideSeries(derivative(sumSeries('.$base.'.cpu.system,'.$base.'.cpu.stolen,'.$base.'.cpu.irg,'.$base.'.cpu.soft-irq)),derivative('.$base.'.cpu.total)),"system")', '#cc00cc')
			->addMetric('alias(divideSeries(derivative('.$base.'.cpu.nice),derivative('.$base.'.cpu.total)),"Nice")', '#00cc00')
			->displayStacked(true)
			->setYMax(1)
			->setSize($width, $height);

	case "memory free":
		return Graphite::inst()
			->setTitle($title)
			->addMetric('alias('.$base.'.memory.free,"Free")', '#00cc00')
			->addMetric('alias('.$base.'.memory.buffer,"Buffer")', '#00cccc')
			->addMetric('alias('.$base.'.memory.swap-cache,"Swap Cache")', '#000077')
			->displayStacked(true)
			->setSize($width, $height);

	case "physical memory used":
		$graph = Graphite::inst()
			->setTitle($title)
			->displayStacked(true)
			->setSize($width, $height);
		foreach(array('apache','nginx','varnish','mysql','postgres','solr','php','java','exim','console','ssh','other') as $rssMetric) {
			$graph->addMetric('alias('.$base.'.memory.rss.'.$rssMetric.',"'.$rssMetric.'")');
		}
		return $graph;

	case "swapping":
		return Graphite::inst()
			->setTitle($title)
			->addMetric('alias(derivative('.$base.'.memory.swapped-in),"Swap In")', '#00cc00')
			->addMetric('alias(derivative('.$base.'.memory.swapped-out),"Swap Out")', '#cc00cc')
			->setSize($width, $height);

	case "apc":
		return Graphite::inst()
			->setTitle($title)
			->addMetric('alias('.$base.'.php.apc.cache-misses,"Cache misses (spikes OK)")')
			->addMetric('alias(secondYAxis('.$base.'.php.apc.free-mem),"Free APC memory")')
			->setSize($width, $height);

	// Site-specific
	case "requests":
		return Graphite::inst()
			->setTitle($site)
			->addMetric('alias('.$base.'.apache.'.$site.'.request.req_per_min,"Requests per min")', '#00cc00')
			->addMetric('alias(secondYAxis('.$base.'.apache.'.$site.'.request.time_95),"Response time (95th percentile)")', '#cc0000')
			->addMetric('alias(secondYAxis('.$base.'.apache.'.$site.'.request.time_avg),"Response time (avg)")', '#aa5500')
			->setSize($width, $height);

	case "% by http code":
		return Graphite::inst()
			->setTitle($site)
			->addMetric('alias(secondYAxis(drawAsInfinite('.$base.'.apache.'.$site.'.status.http_5xx)),"5xx error occurred")', '#0000FF')
			->addMetric('alias(scale(divideSeries('.$base.'.apache.'.$site.'.status.http_3xx,'.$base.'.apache.'.$site.'.request.req_per_min),100),"3xx (%)")', '#cc0000')
			->addMetric('alias(scale(divideSeries('.$base.'.apache.'.$site.'.status.http_4xx,'.$base.'.apache.'.$site.'.request.req_per_min),100),"4xx (%)")', '#00cc00')
			->addMetric('alias(scale(divideSeries('.$base.'.apache.'.$site.'.status.http_5xx,'.$base.'.apache.'.$site.'.request.req_per_min),100),"5xx (%)")', '#0000cc')
			->setSize($width, $height);



	}
}
