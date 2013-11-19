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
	public static $managed_models = array('DNProject');
	
	/**
	 *
	 * @var string 
	 */
	private static $menu_priority = 100;

}
