<?php
/**
 * Will convert the Filename to the version 1.2 of deploynaut where it 
 * more or less is exactly is the same as the Name but with .rb 
 */
class DNMigrate1_1to1_2 extends BuildTask {
	
	public function run($request = null) {
		
		$projects = DNProject::get();
		
		foreach($projects as $project) {
			$environments = $project->DNEnvironmentList();
			foreach($environments as $environment) {
				$newFilename = basename($environment->Filename);
				if($environment->Filename != $newFilename) {
					echo 'Migrating "'.$environment->Filename.'" to '.$newFilename.PHP_EOL;
					$environment->Filename = $newFilename;
					$environment->write();
				}
			}
		}
		
		$warnings = false;
		// Check if all project folders exists
		foreach($projects as $project) {
			if(!$project->projectFolderExists()) {
				$warnings = true;
				echo 'Project '.$project->Name.' don\'t have a cap project folder'.PHP_EOL;
			}
		}
		if($warnings) {
			exit(1);
		}
	}
}