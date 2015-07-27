<?php

class DNAdmin extends ModelAdmin {

	/**
	 *
	 * @var string
	 */
	public static $menu_title = "Deploynaut Projects";

	/**
	 *
	 * @var string
	 */
	public static $url_segment = "naut";

	/**
	 *
	 * @var array
	 */
	public static $managed_models = array(
		'DNProject' => array('title' => 'Projects'),
		'DNDataTransfer' => array('title' => 'Transfers'),
		'DNDataArchive' => array('title' => 'Archives'),
	);

	/**
	 *
	 * @var string
	 */
	private static $menu_priority = 100;

}
