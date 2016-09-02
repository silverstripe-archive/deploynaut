<?php

class MigrateDeploymentStatusTask extends BuildTask {

	public function run($request) {
		$log = function($message) {
			$message = sprintf('[%s] ', date('Y-m-d H:i:s')) . $message;
			echo $message . PHP_EOL;
		};

		if (!Director::is_cli()) {
			$log('This command can only run via CLI');
			return;
		}

		$columns = DB::query('SHOW COLUMNS FROM "DNDeployment"')->column();
		if (!in_array('Status', $columns)) {
			$log('Migration has already been run');
			return;
		}

		foreach (DB::query('SELECT "ID", "Status" FROM "DNDeployment"') as $record) {
			// This record looks to be already migrated
			if (empty($record['Status'])) {
				continue;
			}

			switch ($record['Status']) {
				case 'Queued':
					DB::query(sprintf('UPDATE "DNDeployment" SET "State" = \'Queued\' WHERE "ID" = %s', $record['ID']));
					break;
				case 'Started':
					DB::query(sprintf('UPDATE "DNDeployment" SET "State" = \'Deploying\' WHERE "ID" = %s', $record['ID']));
					break;
				case 'Finished':
					DB::query(sprintf('UPDATE "DNDeployment" SET "State" = \'Completed\' WHERE "ID" = %s', $record['ID']));
					break;
				case 'Failed':
					DB::query(sprintf('UPDATE "DNDeployment" SET "State" = \'Failed\' WHERE "ID" = %s', $record['ID']));
					break;
			}

			// Blank out the old column, as it has been successfully migrated.
			DB::query(sprintf('UPDATE "DNDeployment" SET "Status" = NULL WHERE "ID" = %s', $record['ID']));

			$log(sprintf('DNDeployment record %s has been successfully migrated', $record['ID']));
		}

		DB::query('ALTER TABLE "DNDeployment" DROP COLUMN "Status"');
		$log('Finished');
	}

}
