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
		
		
		chdir(dirname(getcwd()));
		$deploymentCommand = 'cap -v '.$environment.' deploy -s build='.$buildname;
		
		$logfilePath = ASSETS_DIR.DIRECTORY_SEPARATOR.$logfile;
		$command = '';
		// Mac OS X don't support nohup
		if(PHP_OS !== 'Darwin') {
			$command .= 'nohup ';
		}
		
		$command .= $deploymentCommand;
		
		$command .= $command. " > '{$logfilePath}' 2> '{$logfilePath}' < /dev/null &";
		system($command);
	}
}
