<?php

/**
 * Parent class for managing a set of Deploynaut data
 */
class DNData {

	/**
	 * Path where the environment configurations can be found.
	 */
	protected $environmentDir = '';

	/**
	 * Path where the keys are stored.
	 */
	protected $keyDir = '';

	/**
	 * Path where data transfers are stored.
	 * Needs to be relative to webroot, and start with assets/
	 * since all files are also referenced in the SilverStripe database
	 * through {@link File}.
	 */
	protected $dataTransferDir = '';

	/**
	 * A prebuilt DNProjectList.
	 */
	protected $projectList;

	/**
	 * If set, this provides an alternate user to the current one
	 * executing the Git shell commands. e.g. if this is set to
	 * a user called "composer", any Git commands that Deploynaut
	 * will perform will be run as "sudo -u composer git ..."
	 *
	 * @var string|null
	 */
	protected $gitUser = null;

	/**
	 *
	 * @var DeploymentBackend
	 */
	protected $backend;

	public function __construct($environmentDir, $keyDir, $dataTransferDir, $gitUser = null) {
		$this->backend = Injector::inst()->get('DeploymentBackend');
		$this->setEnvironmentDir($environmentDir);
		$this->setKeyDir($keyDir);
		$this->setDataTransferDir($dataTransferDir);
		$this->setGitUser($gitUser);
	}

	public function getEnvironmentDir() {
		return $this->environmentDir;
	}

	public function setEnvironmentDir($environmentDir) {
		if($environmentDir[0] != "/") $environmentDir = BASE_PATH . '/' . $environmentDir;
		$this->environmentDir = $environmentDir;
	}

	public function getKeyDir() {
		return $this->keyDir;
	}
	
	public function setKeyDir($keyDir) {
		if($keyDir[0] != "/") $keyDir = BASE_PATH . '/' . $keyDir;
		$this->keyDir = $keyDir;
	}

	public function getGitUser() {
		return $this->gitUser;
	}

	public function setGitUser($user) {
		$this->gitUser = $user;
	}

	public function getDataTransferDir() {
		return $this->dataTransferDir;
	}

	public function setDataTransferDir($dir) {
		if($dir[0] != "/") $dir = BASE_PATH . '/' . $dir;
		if(strpos($dir, ASSETS_PATH) !== 0) {
			throw new LogicException(sprintf(
				'DNData::dataTransferDir needs to be located within <webroot>assets/ (location: %s)',
				$dir
			));
		}
		$this->dataTransferDir = $dir;
	}

	/**
	 *
	 * @return DNProjectList
	 */
	public function DNProjectList() {
		return DNProject::get();
	}

	/**
	 *
	 * @return DeploymentBackend
	 */
	public function Backend() {
		return $this->backend;
	}

	/**
	 * Grabs a list of projects from the env directory. The projects
	 * in the builds directory alone will not be picked up.
 	 * Returns an array of paths
 	 */
	public function getProjectPaths() {
		$paths = array();
		if(!file_exists($this->getEnvironmentDir())) {
			throw new Exception('The environment directory '.$this->getEnvironmentDir().' doesn\'t exist. Create it first and add some projects to it.');
		}
		foreach(scandir($this->getEnvironmentDir()) as $project) {
			// Exlcude dot-prefixed directories (.git was getting in the way)
			if(preg_match('/^[^\.]/', $project)) {
				$path = $this->getEnvironmentDir().'/'.$project;
				if(is_dir($path) && $project!='.' && $project!='..') {
					$paths[] = $project;
				}
			}
		}
		sort($paths);
		return array_values($paths);
	}

	/**
	 * Scan the directory and enumerate all envs founds within.
	 * Returns an array of paths
	 */
	public function getEnvironmentPaths($project) {
		$baseDir = $this->getEnvironmentDir() . '/' . $project;

		$paths = array();
		if(!file_exists($baseDir)) {
			throw new Exception('Environment directory '.$baseDir.' doesn\'t exist. Create it first.');
		}
		// Search the directory for config files.
		foreach(scandir($baseDir) as $environmentFile) {
			if(preg_match('/\.rb$/', $environmentFile)) {
				// Config found, wrap it into an object.
				$paths[] = "$baseDir/$environmentFile";
			}
		}
		sort($paths);
		return array_values($paths);
	}

}
