<?php

class DNAdmin extends ModelAdmin {
	static $menu_title = "Deploynaut Projects";
	static $url_segment = "naut";
	static $managed_models = array('DNProject');
}