<?php
/**
 * Surface Filesystem::sync() as a dev task in case CMS has not been included.
 */
class CMSFilesystemSyncTask extends BuildTask {
	public function run($request = null) {
		Filesystem::sync();
	}
}
