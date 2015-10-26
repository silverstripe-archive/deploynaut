<?php

class DeploynautSecurityExtension extends Extension {

	public function onAfterInit() {
		// the 'ping' action is called via AJAX from the /admin and will cause
		// the admin section to 'grow' over time. We only need the css and js
		// for login, reset, logout and so on.
		if(!$this->owner->getRequest()->isAjax()) {
			DNRoot::include_requirements();
		}
	}
}
