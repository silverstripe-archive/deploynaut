<?php
use \Symfony\Component\Process\Process;

class CapistranoDeploymentBackend implements DeploymentBackend {

	/**
	 * Return information about the current build on the given environment.
	 * Returns a map with keys:
	 * - 'buildname' - the non-simplified name of the build deployed
	 * - 'datetime' - the datetime when the deployment occurred, in 'Y-m-d H:i:s' format
	 */
	public function currentBuild($environment) {
		$file = DEPLOYNAUT_LOG_PATH . '/' . $environment . ".deploy-history.txt";

		if(file_exists($file)) {
			$lines = file($file);
			$lastLine = array_pop($lines);
			return $this->convertLine($lastLine);
		}
	}

	/**
	 * Deploy the given build to the given environment.
	 */
	public function deploy($environment, $sha, DeploynautLogFile $log, DNProject $project) {
		$repository = $project->LocalCVSPath;
		$projectName = $project->Name;
		$env = $project->getProcessEnv();

		$project = DNProject::get()->filter('Name', $projectName)->first();
		GraphiteDeploymentNotifier::notify_start($environment, $sha, null, $project);

		$log->write('Deploying "'.$sha.'" to "'.$projectName.':'.$environment.'"');

		$this->enableMaintenance($environment, $log, $project);

		$args = array(
			'branch' => $sha,
			'repository' => $repository
		);
		$command = $this->getCommand('deploy', $projectName.':'.$environment, $args, $env, $log);
		$command->run(function ($type, $buffer) use($log) {
			$log->write($buffer);
		});
		if(!$command->isSuccessful()) {
			// disable the maintenance page in the event of a failure
			$this->disableMaintenance($environment, $log, $project);
			throw new RuntimeException($command->getErrorOutput());
		}

		$this->disableMaintenance($environment, $log, $project);

		$log->write('Deploy done "'.$sha.'" to "'.$projectName.':'.$environment.'"');

		GraphiteDeploymentNotifier::notify_end($environment, $sha, null, $project);
	}

	/**
	 * Enable a maintenance page for the given environment using the maintenance:enable Capistrano task.
	 */
	public function enableMaintenance($environment, DeploynautLogFile $log, DNProject $project) {
		$projectName = $project->Name;
		$env = $project->getProcessEnv();

		$command = $this->getCommand('maintenance:enable', $projectName.':'.$environment, null, $env, $log);
		$command->run(function ($type, $buffer) use($log) {
			$log->write($buffer);
		});
		if(!$command->isSuccessful()) {
			throw new RuntimeException($command->getErrorOutput());
		}
		$log->write('Maintenance page enabled on "' . $projectName.':'.$environment.'"');
	}

	/**
	 * Disable the maintenance page for the given environment using the maintenance:disable Capistrano task.
	 */
	public function disableMaintenance($environment, DeploynautLogFile $log, DNProject $project) {
		$projectName = $project->Name;
		$env = $project->getProcessEnv();

		$command = $this->getCommand('maintenance:disable', $projectName.':'.$environment, null, $env, $log);
		$command->run(function ($type, $buffer) use($log) {
			$log->write($buffer);
		});
		if(!$command->isSuccessful()) {
			throw new RuntimeException($command->getErrorOutput());
		}
		$log->write('Maintenance page disabled on "' . $projectName.':'.$environment.'"');
	}

	/**
	 * Deploy the given build to the given environment.
	 * 
	 * @param DNProject $environment
	 * @param string $environment
	 */
	public function ping($environment, DeploynautLogFile $log, DNProject $project) {
		$projectName  = $project->Name;
		$env = $project->getProcessEnv();
		$command = $this->getCommand('deploy:check', $projectName.':'.$environment, null, $env, $log);
		$command->run(function ($type, $buffer) use($log) {
			$log->write($buffer);
			echo $buffer;
		});
	}

	/**
	 * @inheritdoc
	 */
	public function dataTransfer(DNDataTransfer $dataTransfer, DeploynautLogFile $log) {
		if($dataTransfer->Direction == 'get') {
			$this->dataTransferBackup($dataTransfer, $log);
		} else {
			$envObj = $dataTransfer->Environment();
			$envName = $envObj->Name;
			$project = $envObj->Project();

			// put up a maintenance page during a restore of db or assets
			$this->enableMaintenance($envName, $log, $project);

			try {
				$this->dataTransferRestore($dataTransfer, $log);
			} catch(RuntimeException $e) {
				// disable the maintenance page in the event of an exception
				$this->disableMaintenance($envName, $log, $project);
				throw $e;
			}

			$this->disableMaintenance($envName, $log, $project);
		}
	}

	/**
	 * @param string $action Capistrano action to be executed
	 * @param string $environment Capistrano identifier for the environment (see capistrano-multiconfig)
	 * @param array $args Additional arguments for process
	 * @param string $env Additional environment variables
	 * @param DeploynautLogFile $log
	 * @return \Symfony\Component\Process\Process
	 */
	protected function getCommand($action, $environment, $args = null, $env = null, DeploynautLogFile $log) {
		if(!$args) $args = array();
		$args['history_path'] = realpath(DEPLOYNAUT_LOG_PATH.'/');

		// Inject env string directly into the command.
		// Capistrano doesn't like the $process->setEnv($env) we'd normally do below.
		$envString = '';
		if (!empty($env)) {
			$envString .= 'env ';
			foreach ($env as $key => $value) {
				$envString .= "$key=\"$value\" ";
			}
		}

		$data = Injector::inst()->get('DNData');
		// Generate a capfile from a template
		$capTemplate = file_get_contents(BASE_PATH.'/deploynaut/Capfile.template');
		$cap = str_replace(
			array('<config root>', '<ssh key>', '<base path>'),
			array($data->getEnvironmentDir(), DEPLOYNAUT_SSH_KEY, BASE_PATH),
			$capTemplate
		);

		if(defined('DEPLOYNAUT_CAPFILE')) {
			$capFile = DEPLOYNAUT_CAPFILE;
		} else {
			$capFile = BASE_PATH.'/assets/Capfile';
		}
		file_put_contents($capFile, $cap);

		$command = "{$envString}cap -f " . escapeshellarg($capFile) . " -vv $environment $action";
		foreach($args as $argName => $argVal) {
			$command .= ' -s ' . escapeshellarg($argName) . '=' . escapeshellarg($argVal);
		}

		$log->write("Running command: $command");

		$process = new Process($command);
		// Capistrano doesn't like it - see comment above.
		//$process->setEnv($env);
		$process->setTimeout(3600);
		return $process;
	}

	/**
	 * Backs up database and/or assets to a designated folder,
	 * and packs up the files into a single sspak.
	 * 
	 * @param  DNDataTransfer    $dataTransfer
	 * @param  DeploynautLogFile $log         
	 */
	protected function dataTransferBackup(DNDataTransfer $dataTransfer, DeploynautLogFile $log) {
		$environmentObj = $dataTransfer->Environment();
		$project = $environmentObj->Project();
		$projectName = $project->Name;
		$environmentName = $environmentObj->Name;
		$env = $project->getProcessEnv();
		$project = DNProject::get()->filter('Name', $projectName)->first();
		$name = $projectName . ':' . $environmentName;

		// Associate a new archive with the transfer.
		// Doesn't retrieve a filepath just yet, need to generate the files first.
		$dataArchive = new DNDataArchive();
		$dataArchive->Mode = $dataTransfer->Mode;
		$dataArchive->AuthorID = $dataTransfer->AuthorID;
		$dataArchive->OriginalEnvironmentID = $dataTransfer->Environment()->ID;
		$dataArchive->EnvironmentID = $dataTransfer->Environment()->ID;
		$dataArchive->IsBackup = $dataTransfer->IsBackupDataTransfer();

		// Generate directory structure with strict permissions (contains very sensitive data)
		$filepathBase = $dataArchive->generateFilepath($dataTransfer);
		mkdir($filepathBase, 0700, true);

		$databasePath = $filepathBase . DIRECTORY_SEPARATOR . 'database.sql';

		// Backup database
		if(in_array($dataTransfer->Mode, array('all', 'db'))) {
			$log->write('Backup of database from "' . $name . '" started');
			$args = array(
				'data_path' => $databasePath
			);
			$command = $this->getCommand("data:getdb", $name, $args, $env, $log);
			$command->run(function ($type, $buffer) use($log) {
				$log->write($buffer);
			});
			if(!$command->isSuccessful()) {
				throw new RuntimeException($command->getErrorOutput());
			}
			$log->write('Backup of database from "' . $name . '" done');
		}
		
		// Backup assets
		if(in_array($dataTransfer->Mode, array('all', 'assets'))) {
			$log->write('Backup of assets from "' . $name . '" started');
			$args = array(
				'data_path' => $filepathBase
			);
			$command = $this->getCommand("data:getassets", $name, $args, $env, $log);
			$command->run(function ($type, $buffer) use($log) {
				$log->write($buffer);
			});
			if(!$command->isSuccessful()) {
				throw new RuntimeException($command->getErrorOutput());
			}
			$log->write('Backup of assets from "' . $name . '" done');
		}

		$log->write('Creating *.sspak file');
		$sspakFilename = sprintf('%s.sspak', $dataArchive->generateFilename($dataTransfer));
		$sspakCmd = sprintf('cd %s && sspak saveexisting %s 2>&1', $filepathBase, $sspakFilename);
		if($dataTransfer->Mode == 'db') {
			$sspakCmd .= sprintf(' --db=%s', $databasePath);
		} elseif($dataTransfer->Mode == 'assets') {
			$sspakCmd .= sprintf(' --assets=%s/assets', $filepathBase);
		} else {
			$sspakCmd .= sprintf(' --db=%s --assets=%s/assets', $databasePath, $filepathBase);
		}

		$process = new Process($sspakCmd);
		$process->setTimeout(3600);
		$process->run();
		if(!$process->isSuccessful()) {
			$log->write('Could not package the backup via sspak');
			throw new RuntimeException($process->getErrorOutput());
		}

		// HACK: find_or_make() expects path relative to assets/
		$sspakFilepath = ltrim(
			str_replace(ASSETS_PATH, '', $filepathBase . DIRECTORY_SEPARATOR . $sspakFilename), 
			DIRECTORY_SEPARATOR
		);

		try {
			$folder = Folder::find_or_make(dirname($sspakFilepath));
			$file = new File();
			$file->Name = $sspakFilename;
			$file->Filename = $sspakFilepath;
			$file->ParentID = $folder->ID;
			$file->write();

			// "Status" will be updated by the job execution
			$dataTransfer->write();

			// Get file hash to ensure consistency.
			// Only do this when first associating the file since hashing large files is expensive.
			$dataArchive->ArchiveFileHash = md5_file($file->FullPath);
			$dataArchive->ArchiveFileID = $file->ID;
			$dataArchive->DataTransfers()->add($dataTransfer);
			$dataArchive->write();
		} catch (Exception $e) {
			$log->write('Failed to add sspak file: ' . $e->getMessage());
			throw new RuntimeException($e->getMessage());
		}

		// Remove any assets and db files lying around, they're not longer needed as they're now part
		// of the sspak file we just generated. Use --force to avoid errors when files don't exist,
		// e.g. when just an assets backup has been requested and no database.sql exists.
		$process = new Process(sprintf('rm -rf %s/assets && rm -f %s', $filepathBase, $databasePath));
		$process->run();
		if(!$process->isSuccessful()) {
			$log->write('Could not delete temporary files');
			throw new RuntimeException($process->getErrorOutput());
		}

		$log->write(sprintf(
			'Creating *.sspak file done: %s',
			$file->getAbsoluteURL()
		));
	}

	/**
	 * Utility function for triggering the db rebuild.
	 */
	protected function rebuildDatabase($name, $env, $log) {
		// Rebuild db and flush.
		$command = $this->getCommand('data:rebuild', $name, null, $env, $log);
		$command->run(function ($type, $buffer) use($log) {
			$log->write($buffer);
		});
		if(!$command->isSuccessful()) {
			$log->write('Rebuild of "' . $name . '" failed: ' . $command->getErrorOutput());
			throw new RuntimeException($command->getErrorOutput());
		}
		$log->write('Rebuild of "' . $name . '" done');
	}

	/**
	 * Extracts a *.sspak file referenced through the passed in $dataTransfer
	 * and pushes it to the environment referenced in $dataTransfer.
	 * 
	 * @param  DNDataTransfer    $dataTransfer
	 * @param  DeploynautLogFile $log         
	 */
	protected function dataTransferRestore(DNDataTransfer $dataTransfer, DeploynautLogFile $log) {
		$environmentObj = $dataTransfer->Environment();
		$project = $environmentObj->Project();
		$projectName = $project->Name;
		$environmentName = $environmentObj->Name;
		$env = $project->getProcessEnv();
		$project = DNProject::get()->filter('Name', $projectName)->first();
		$name = $projectName . ':' . $environmentName;
		$tempPath = TEMP_FOLDER . DIRECTORY_SEPARATOR . 'deploynaut-transfer-' . $dataTransfer->ID;
		mkdir($tempPath, 0700, true);

		$cleanupFn = function() use ($tempPath) {
			$process = new Process('rm -rf ' . escapeshellarg($tempPath));
			$process->run(); 
		};

		// Extract *.sspak to a temporary location
		$log->write('Extracting *.sspak file');
		$sspakFilename = $dataTransfer->DataArchive()->ArchiveFile()->FullPath;
		$sspakCmd = sprintf('sspak extract %s %s', escapeshellarg($sspakFilename), escapeshellarg($tempPath));
		$log->write($sspakCmd);
		$process = new Process($sspakCmd);
		$process->setTimeout(3600);
		$process->run();
		if(!$process->isSuccessful()) {
			$log->write('Could not extract the *.sspak file: ' . $process->getErrorOutput());
			$cleanupFn();
			throw new RuntimeException($process->getErrorOutput());
		}


		// TODO Validate that file actually contains the desired modes

		// Restore database
		if(in_array($dataTransfer->Mode, array('all', 'db'))) {
			// Upload into target environment
			$log->write('Restore of database to "' . $name . '" started');
			$args = array(
				'data_path' => $tempPath . DIRECTORY_SEPARATOR . 'database.sql.gz'
			);
			$command = "data:pushdb";
			$command = $this->getCommand($command, $name, $args, $env, $log);
			$command->run(function ($type, $buffer) use($log) {
				$log->write($buffer);
			});
			if(!$command->isSuccessful()) {
				// Rebuild, maybe we can at least partly recover?
				$this->rebuildDatabase($name, $env, $log);

				$cleanupFn();
				$log->write('Restore of database to "' . $name . '" failed: ' . $command->getErrorOutput());
				throw new RuntimeException($command->getErrorOutput());
			}
			$log->write('Restore of database to "' . $name . '" done');
		}
		
		// Restore assets
		if(in_array($dataTransfer->Mode, array('all', 'assets'))) {
			// Upload into target environment
			$log->write('Restore of assets to "' . $name . '" started');

			// Extract assets.tar.gz into assets/
			$extractCmd = sprintf(
				'cd %s && tar xzf %s',
				escapeshellarg($tempPath),
				escapeshellarg($tempPath . DIRECTORY_SEPARATOR . 'assets.tar.gz')
			);
			
			$log->write($extractCmd);
			$process = new Process($extractCmd);
			$process->setTimeout(3600);
			$process->run();
			if(!$process->isSuccessful()) {
				// The database might have been restored beforehand - rebuild, maybe we can at least partly recover?
				if(in_array($dataTransfer->Mode, array('all', 'db'))) {
					$log->write('Asset restoration failed but DB was restored, so rebuilding anyway.');
					$this->rebuildDatabase($name, $env, $log);
				}

				$log->write('Could not extract the assets archive');
				$cleanupFn();
				throw new RuntimeException($process->getErrorOutput());
			}

			$args = array(
				'data_path' => $tempPath . DIRECTORY_SEPARATOR . 'assets'
			);
			$command = "data:pushassets";
			$command = $this->getCommand($command, $name, $args, $env, $log);
			$command->run(function ($type, $buffer) use($log) {
				$log->write($buffer);
			});
			if(!$command->isSuccessful()) {
				// The database might have been restored beforehand - rebuild, maybe we can at least partly recover?
				if(in_array($dataTransfer->Mode, array('all', 'db'))) {
					$log->write('Asset restoration failed but DB was restored, so rebuilding anyway.');
					$this->rebuildDatabase($name, $env, $log);
				}

				$cleanupFn();
				$log->write('Restore of assets to "' . $name . '" failed: ' . $command->getErrorOutput());
				throw new RuntimeException($command->getErrorOutput());
			}
			$log->write('Restore of assets to "' . $name . '" done');
		}

		$log->write('Rebuilding and cleaning up');
		$this->rebuildDatabase($name, $env, $log);
		$cleanupFn();
	}

}
