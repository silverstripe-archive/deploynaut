<?php

class SnapshotsCleanup extends BuildTask {
	protected $title = 'Snapshot Cleanup';

	protected $description = 'Attempt to aggressivly remove all broken or half completed snapshots';

	public function run($request) {
		echo PHP_EOL . PHP_EOL;

		$wet = (bool)$request->getVar('wet');

		if (!$wet) {
			echo "Running in dry mode. To run in wet mode, set the ?wet=true parameter" . PHP_EOL . PHP_EOL;
		} else {
			echo "<b>RUNNING IN WET MODE</b>" . PHP_EOL . PHP_EOL;
		}

		// Start looking in the same place assets are stored
		$path = DNData::inst()->getDataTransferDir();
		
		$base_dir = dir($path);
		while (false !== ($project_dir = $base_dir->read())) {
			// Filter out . and .., but also manual since we use that for other things
			if ($project_dir == "." || $project_dir == ".." || $project_dir == 'manual') {
				continue;
			}

			// Confirm whether any of the folders here are projects that don't exist

			// Lookup $project
			$proj = DNProject::get()->filter(array('Name' => $project_dir))->first();
			if (empty($proj)) {
				// It looks like it's bogus!
				echo "Deleting snapshot folder that doesn't match to a project: " . htmlspecialchars($project_dir) . PHP_EOL;

				if ($wet) {
					// shelling out seems a bit lame, but I don't think PHP makes this easy. WHO KNEW
					system("rm -rf " . escapeshellarg($path . '/' . $project_dir));
				} else {
					echo "I would run: rm -rf " . escapeshellarg($path . '/' . $project_dir) . PHP_EOL;
				}
				continue; // another one bites the dust
			}

			// Confirm whether any of the environments don't exist
			$ass_env_dir = dir($path . '/' . $project_dir);
			while (false !== ($env_dir = $ass_env_dir->read())) {
				if ($env_dir == "." || $env_dir == "..") {
					continue;
				}
				// Lookup the environment
				$env = $proj->Environments()->filter(array('Name' => $env_dir))->first();
				if (empty($env)) {
					// BOGUS AS BRO
					echo "Deleting snapshot environment folder that doesn't match to an environment: " . htmlspecialchars($env_dir) . PHP_EOL;

					if ($wet) {
						system("rm -rf " . escapeshellarg($path . '/' . $project_dir . '/' . $env_dir));
					} else {
						echo "I would run: rm -rf " . escapeshellarg($path . '/' . $project_dir . '/' . $env_dir) . PHP_EOL;
					}
					continue; // BURN IT TO THE GROUND
				}

				// Check each of the files inside that directory
				$ass_files = dir($path . '/' . $project_dir . '/' . $env_dir);
				while (false !== ($ass_dir = $ass_files->read())) {
					if ($ass_dir == "." || $ass_dir == "..") {
						continue;
					}

					$file = File::get()->filter(array('Filename:EndsWith' => $project_dir . '/' . $env_dir . '/' . $ass_dir . '/'))->first();
					if (empty($file)) {
						echo "Deleting a rogue directory found in an environment: " . htmlspecialchars($ass_dir) . PHP_EOL;
						if ($wet) {
							system("rm -rf " . escapeshellarg($path . '/' . $project_dir . '/' . $env_dir . '/' . $ass_dir));
						} else {
							echo "I would run: rm -rf " . escapeshellarg($path . '/' . $project_dir . '/' . $env_dir . '/' . $ass_dir) . PHP_EOL;
						}
						continue; // CAKE OR DEATH?!
					}

					// Lets check inside!
					$rand_files = dir($path . '/' . $project_dir . '/' . $env_dir . '/' . $ass_dir);
					$is_empty = true; // a flag for whether the dir was empty
					while (false !== ($rand_dir = $rand_files->read())) {
						if ($rand_dir == "." || $rand_dir == "..") {
							continue;
						}
						$is_empty = false;

						// Basically, delete anything that isn't a .sspak. We could probably be more aggressive and delete .sspak too, but that's more work and I'M LAZY.
						if (substr($rand_dir, -6) != '.sspak') {
							echo "Found a rogue directory inside a transfer (is it left over from a failed deployment?): " . htmlspecialchars($rand_dir) . PHP_EOL;
							if ($wet) {
								system("rm -rf " . escapeshellarg($path . '/' . $project_dir . '/' . $env_dir . '/' . $ass_dir . '/' . $rand_dir));
							} else {
								echo "I would run: rm -rf " . escapeshellarg($path . '/' . $project_dir . '/' . $env_dir . '/' . $ass_dir . '/' . $rand_dir) . PHP_EOL;
							}
							continue; // BOOM GOES THE DYNAMITE
						}
					}
					if ($is_empty) {
						// An empty transfer directory? GET YOUR GUN.
						echo "Found an empty transfer directory: " . htmlspecialchars($ass_dir) . PHP_EOL;
						if ($wet) {
							system("rm -rf " . escapeshellarg($path . '/' . $project_dir . '/' . $env_dir . '/' . $ass_dir));
						} else {
							echo "I would run: rm -rf " . escapeshellarg($path . '/' . $project_dir . '/' . $env_dir . '/' . $ass_dir) . PHP_EOL;
						}
						// oh, a continue? I think not. See, we're already done. It would be USELESS at this point. USELESS I TELL YOU. USELESSSSSSSSSSSSSS
					}
				}
			}

			
		}
	}
}

