<?php
/**
 * Deploynaut doesn't have the CMS. Surface Filesystem::sync() as a dev task.
 */
class FilesystemSyncTask extends BuildTask {
	
	public function run($request = null) {
		Filesystem::sync();
	}
}

