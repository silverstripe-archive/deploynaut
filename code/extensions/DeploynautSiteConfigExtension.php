<?php

class DeploynautSiteConfigExtension extends DataExtension {

	private static $support_links = array();

	function getSupportLinks() {
		$supportLinks = $this->owner->config()->support_links;
		if ($supportLinks) return new ArrayList($supportLinks);
	}

}