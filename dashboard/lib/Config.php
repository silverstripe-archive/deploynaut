<?php

class GraphiteConfig {

    public static $graphite_base_url = 'http://localhost/deploynaut/graphite';

    public static $graphite_deploys = array(
        'config' => array('color' => '#0000ff', 'title' => 'Config',    'target' => 'deploy.config.prod'),
        'web'    => array('color' => '#ff0000', 'title' => 'Web',       'target' => 'deploy.web.prod'),
        'search' => array('color' => '#006633', 'title' => 'Search',    'target' => 'deploy.search.prod'),
        'photos' => array('color' => '#cc6600', 'title' => 'Photos',    'target' => 'deploy.photos.prod'),
    );

}
