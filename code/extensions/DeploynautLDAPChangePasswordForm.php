<?php

class DeploynautLDAPChangePasswordForm extends LDAPChangePasswordForm {

	/**
	 * If there is no BackURL set, default to the homepage of the site,
	 * rather than the default in {@link ChangePassword::doChangePassword()}
	 * which is Security/login.
	 */
	public function doChangePassword(array $data) {
		if(empty($_REQUEST['BackURL'])) {
			$_REQUEST['BackURL'] = Director::absoluteBaseURL();
		}

		return parent::doChangePassword($data);
	}

}
