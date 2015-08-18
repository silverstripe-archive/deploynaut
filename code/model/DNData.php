<?php

/**
 * Parent class for managing a set of Deploynaut data
 */
class DNData extends ViewableData {

	/**
	 * Path where the environment configurations can be found.
	 *
	 * @var string
	 */
	protected $environmentDir = '';

	/**
	 * Path where the keys are stored.
	 *
	 * @var string
	 */
	protected $keyDir = '';

	/**
	 * Path where data transfers are stored.
	 * Needs to be relative to webroot, and start with assets/
	 * since all files are also referenced in the SilverStripe database
	 * through {@link File}.
	 *
	 * @var string
	 */
	protected $dataTransferDir = '';

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
	 * Gets the DNData singleton
	 *
	 * @return DNData
	 */
	public static function inst() {
		return Injector::inst()->get('DNData');
	}

	public function __construct($environmentDir = null, $keyDir = null, $dataTransferDir = null, $gitUser = null) {
		parent::__construct();

		// Better to use injector to set these
		if(func_num_args() == 0) return;
		Deprecation::notice(
			'1.2.0',
			"Don't construct DNData with parameters. Assign settings via properties instead"
		);
		$this->setEnvironmentDir($environmentDir);
		$this->setKeyDir($keyDir);
		$this->setDataTransferDir($dataTransferDir);
		$this->setGitUser($gitUser);
	}

	/**
	 * Get the directory environment code is saved
	 *
	 * @return string
	 */
	public function getEnvironmentDir() {
		return $this->environmentDir;
	}

	/**
	 * Set the directory environment code is saved
	 *
	 * @param string $environmentDir
	 */
	public function setEnvironmentDir($environmentDir) {
		if($environmentDir[0] != "/") $environmentDir = BASE_PATH . '/' . $environmentDir;
		$this->environmentDir = realpath($environmentDir) ?: $environmentDir;
	}

	/**
	 * Get the directory where ssh are stored
	 *
	 * @return string
	 */
	public function getKeyDir() {
		return $this->keyDir;
	}

	/**
	 * Set the directory where ssh are stored
	 *
	 * @param string $keyDir
	 */
	public function setKeyDir($keyDir) {
		if($keyDir[0] != "/") $keyDir = BASE_PATH . '/' . $keyDir;
		$this->keyDir = realpath($keyDir) ?: $keyDir;
	}

	/**
	 * Get the username that git commands should be run as
	 *
	 * @return string
	 */
	public function getGitUser() {
		return $this->gitUser;
	}

	/**
	 * Get the username that git commands should be run as
	 *
	 * @param string $user
	 */
	public function setGitUser($user) {
		$this->gitUser = $user;
	}

	/**
	 * Get the directory where data transfers should be saved
	 *
	 * @return string
	 */
	public function getDataTransferDir() {
		return $this->dataTransferDir;
	}

	/**
	 * Set the directory where data transfers should be saved
	 *
	 * This should either be an absolute path (beginning with /) or a path that can
	 * be appended to the web root safely
	 *
	 * @param string $transferDir
	 */
	public function setDataTransferDir($transferDir) {
		if($transferDir[0] != "/") $transferDir = BASE_PATH . '/' . $transferDir;
		if(strpos($transferDir, ASSETS_PATH) === false) {
			throw new LogicException(sprintf(
				'DNData::dataTransferDir needs to be located within <webroot>assets/ (location: %s)',
				$transferDir
			));
		}
		$this->dataTransferDir = realpath($transferDir) ?: $transferDir;
	}

	/**
	 * Provide a list of all projects.
	 * @return DataList
	 */
	public function DNProjectList() {
		return DNProject::get();
	}

	/**
	 * Grabs a list of projects from the env directory. The projects
	 * in the builds directory alone will not be picked up.
	 * Returns an array of paths
	 *
	 * @return array
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
