<?php

class DNAdmin extends ModelAdmin {

	public static $menu_title = "Deploynaut Projects";
	public static $url_segment = "naut";
	public static $managed_models = array('DNProject');

}
