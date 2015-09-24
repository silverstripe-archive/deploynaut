<?php
class DeploynautSecurityExtension extends Extension {

	public function onAfterInit() {
		DNRoot::include_requirements();
	}

}
