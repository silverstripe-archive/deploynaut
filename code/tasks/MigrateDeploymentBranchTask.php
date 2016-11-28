<?php

class MigrateDeploymentBranchTask extends BuildTask {

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
		if (!in_array('Branch', $columns)) {
			$log('Migration has already been run');
			return;
		}

		if (!in_array('RefName', $columns)) {
			$log('RefName column doesn\'t exist. Has dev/build been run?');
			return;
		}

		foreach (DB::query('SELECT "ID", "Branch" FROM "DNDeployment"') as $record) {
			// This record looks to be already migrated or doesn't have a value to begin with. Skip.
			if (empty($record['Branch'])) {
				continue;
			}

			DB::query(sprintf('UPDATE "DNDeployment" SET "RefName" = \'%s\' WHERE "ID" = %s', $record['Branch'], $record['ID']));

			// Blank out the old column, as it has been successfully migrated.
			DB::query(sprintf('UPDATE "DNDeployment" SET "Branch" = NULL WHERE "ID" = %s', $record['ID']));

			$log(sprintf('DNDeployment record %s has been successfully migrated', $record['ID']));
		}

		DB::query('ALTER TABLE "DNDeployment" DROP COLUMN "Branch"');
		$log('Finished');
	}

}
