<?php

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
	public function deploy($environment, $sha, $log, DNProject $project) {
		$repository = $project->LocalCVSPath;
		$projectName = $project->Name;
		$env = $project->getProcessEnv();

		$project = DNProject::get()->filter('Name', $projectName)->first();
		GraphiteDeploymentNotifier::notify_start($environment, $sha, null, $project);

		$log->write('Deploying "'.$sha.'" to "'.$projectName.':'.$environment.'"');

		$command = $this->getCommand($projectName.':'.$environment, $repository, $sha, $env, $log);
		$command->run(function ($type, $buffer) use($log) {
			$log->write($buffer);
		});
		if(!$command->isSuccessful()) {
			throw new RuntimeException($command->getErrorOutput());
		}
		$log->write('Deploy done "'.$sha.'" to "'.$projectName.':'.$environment.'"');

		GraphiteDeploymentNotifier::notify_end($environment, $sha, null, $project);
	}
	
	/**
	 * Deploy the given build to the given environment.
	 * 
	 * @param DNProject $environment
	 * @param string $environment
	 */
	public function ping($environment, $log, DNProject $project) {
		$projectName  = $project->Name;
		$env = $project->getProcessEnv();
		$command = $this->getPingCommand($projectName.':'.$environment, $env, $log);
		$command->run(function ($type, $buffer) use($log) {
			$log->write($buffer);
			echo $buffer;
		});
	}

	/**
	 *
	 * @param string $environment
	 * @param string $repository
	 * @param string $sha
	 * @param string $logfile
	 * @return \Symfony\Component\Process\Process
	 */
	protected function getCommand($environment, $repository, $sha, $env, $log) {
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
			$capTemplate);

		if(defined('DEPLOYNAUT_CAPFILE')) {
			$capFile = DEPLOYNAUT_CAPFILE;
		} else {
			$capFile = BASE_PATH.'/assets/Capfile';
		}
		file_put_contents($capFile, $cap);

		$command = "{$envString}cap -f " . escapeshellarg($capFile) . " -vv $environment deploy";
		$command.= ' -s repository='.$repository;
		$command.= ' -s branch='.$sha;
		$command.= ' -s history_path='.realpath(DEPLOYNAUT_LOG_PATH.'/');

		$log->write("Running command: $command");

		$process = new \Symfony\Component\Process\Process($command);
		// Capistrano doesn't like it - see comment above.
		//$process->setEnv($env);
		$process->setTimeout(3600);
		return $process;
	}
	
	public function getPingCommand($environment, $env, $log) {
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

		$command = "{$envString}cap -f " . escapeshellarg($capFile) . " -vv $environment deploy:check";
		$command.= ' -s history_path='.realpath(DEPLOYNAUT_LOG_PATH.'/');

		$process = new \Symfony\Component\Process\Process($command);
		$process->setTimeout(3600);
		return $process;
	}
}
