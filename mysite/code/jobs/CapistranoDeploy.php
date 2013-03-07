<?php

/**
 * Description of DeployJob
 *
 */
class CapistranoDeploy {
	
	public $args;
	
	public function perform() {
		$environment = $this->args['environment'];
		$buildname = $this->args['buildname'];
		$logfile = $this->args['logfile'];
		$project = $this->args['project'];

		GraphiteDeploymentNotifier::notify_start($environment, $buildname, $buildFile, $project);

		$logfilePath = ASSETS_PATH.DIRECTORY_SEPARATOR.$logfile;
		chdir(BASE_PATH);
		$logfilePath = ASSETS_PATH.DIRECTORY_SEPARATOR.$logfile;
		$deploymentCommand = 'cap -v '.$environment.' deploy -s build='.$buildname;
		$command = $deploymentCommand. " > '{$logfilePath}' 2> '{$logfilePath}'";
		echo '[=] Start deploy for "'.$environment.'" build "'.$buildname.'"'.PHP_EOL;
		system($command, $status);
		if($status===0) {
				echo '[+] Success '.$logfile.PHP_EOL;
		} else {
				echo '[-] Fail '.$logfile.PHP_EOL;
				throw new Exception('Deployment for "'.$environment.'" build "'.$buildname.'", logfile '.$logfile);
		}

		GraphiteDeploymentNotifier::notify_end($environment, $buildname, $buildFile, $project);
	}
}
