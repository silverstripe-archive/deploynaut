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
		chdir(BASE_PATH);
		$deploymentCommand = 'cap -v '.$environment.' deploy -s build='.$buildname;
		$logfilePath = ASSETS_PATH.DIRECTORY_SEPARATOR.$logfile;
		$command = '';
		$command .= $deploymentCommand;
		$command .= $command. " &> '{$logfilePath}'";
		echo '[=] Start deploy for "'.$environment.'" build "'.$buildname.'"'.PHP_EOL;
		system($command, $status);
		if($status===0) {
			echo '[+] Success '.$logfile.PHP_EOL;
		} else {
			echo '[-] Fail '.$logfile.PHP_EOL;
			throw new Exception('Deployment for "'.$environment.'" build "'.$buildname.'", logfile '.$logfile);
		}
	}
}
