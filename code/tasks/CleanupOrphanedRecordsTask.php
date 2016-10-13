<?php

class CleanupOrphanedRecordsTask extends BuildTask {

	public function run($request) {
		$args = $request->getVar('args');
		$dryRun = $args && in_array('--dry-run', $args);

		$log = function($message) {
			$message = sprintf('[%s] ', date('Y-m-d H:i:s')) . $message;
			echo $message . PHP_EOL;
		};

		if (!Director::is_cli()) {
			$log('This task must be run under the command line');
			return;
		}

		if ($dryRun) {
			$log('Running in dry-run mode. No data will be deleted');
		}

		$count = 0;

		foreach (DNEnvironment::get() as $environment) {
			$project = $environment->Project();
			if (!$project || !$project->exists()) {
				$log(sprintf(
					'Environment (ID %s, Name: %s, Created: %s) is linked to a non-existent project. Deleting',
					$environment->ID,
					$environment->Name,
					$environment->Created
				));
				if (!$dryRun) {
					$environment->delete();
					$environment->destroy();
				}
				$count++;
			}
		}

		foreach (DNDeployment::get() as $deployment) {
			$environment = $deployment->Environment();
			if (!$environment || !$environment->exists()) {
				$log(sprintf(
					'Deployment (ID %s, Created: %s) is linked to a non-existent environment. Deleting',
					$deployment->ID,
					$deployment->Created
				));
				if (!$dryRun) {
					$deployment->delete();
					$deployment->destroy();
				}
				$count++;
			}
		}

		foreach (DNDataTransfer::get() as $transfer) {
			$environment = $transfer->Environment();
			if (!$environment || !$environment->exists()) {
				$log(sprintf(
					'Data transfer (ID %s, Created: %s) is linked to a non-existent environment. Deleting',
					$transfer->ID,
					$transfer->Created
				));
				if (!$dryRun) {
					$transfer->delete();
					$transfer->destroy();
				}
				$count++;
			}
		}

		foreach (DNDataArchive::get() as $archive) {
			$environment = $archive->Environment();
			if (!$environment || !$environment->exists()) {
				$log(sprintf(
					'Archive (ID %s, Created: %s) is linked to a non-existent environment. Deleting',
					$archive->ID,
					$archive->Created
				));
				if (!$dryRun) {
					$archive->delete();
					$archive->destroy();
				}
				$count++;
			}
		}

		foreach (DNGitFetch::get() as $fetch) {
			$project = $fetch->Project();
			if (!$project || !$project->exists()) {
				$log(sprintf(
					'Git fetch (ID %s, Created: %s) is linked to a non-existent project. Deleting',
					$fetch->ID,
					$fetch->Created
				));
				if (!$dryRun) {
					$fetch->delete();
					$fetch->destroy();
				}
				$count++;
			}
		}

		foreach (DNPing::get() as $ping) {
			$environment = $ping->Environment();
			if (!$environment || !$environment->exists()) {
				$log(sprintf(
					'Ping (ID %s, Created: %s) is linked to a non-existent environment. Deleting',
					$ping->ID,
					$ping->Created
				));
				if (!$dryRun) {
					$ping->delete();
					$ping->destroy();
				}
				$count++;
			}
		}

		$log(sprintf('Finished. Processed %s records', $count));
	}

}
