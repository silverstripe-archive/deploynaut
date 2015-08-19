<?php

/**
 * Represents a back-end for generating a package file.
 * A package file is a .tar.gz file of the project, ready to be uploaded to the server
 *
 * These package generators can be used by applicable deployment backends.
 */
abstract class PackageGenerator {

	protected $cache;

	/**
	 * Generate the package file, saving to the given location
	 *
	 * @param string $baseDir string The base directory of the project, checked out from git.
	 * @param $outputFilename string The filename to write to.
	 * @param string $sha
	 *
	 * @return boolean True on success
	 */
	abstract public function generatePackage($sha, $baseDir, $outputFilename, DeploynautLogFile $log);

	/**
	 * Return a string that uniquely identifies this package generator.
	 *
	 * This will be used as part of cache keys; if meaningful changes to the operation of the generator are
	 * made, then the identifier should change. Note there is no need to include the classname in the
	 * identifier; callers to getIdentifier() should be responsible for disambiguating based on class.
	 */
	abstract public function getIdentifier();

	public function getCache() {
		return $this->cache;
	}

	public function setCache(PackageCache $cache) {
		$this->cache = $cache;
	}

	/**
	 * Generate or retrieve a package from the cache
	 *
	 * @param string $identifier A unique identifier for the generator; used to partition the cache
	 * @param string $sha The SHA of the commit to be deployed
	 * @param string $repositoryDir The directory where the repository resides
	 * @param DeploynautLogFile $log The log to write status output to, including package-generation commands
	 *
	 * @return string
	 */
	public function getPackageFilename($identifier, $sha, $repositoryDir, DeploynautLogFile $log) {
		// Fetch through the cache
		if($this->cache) {
			$identifier .= '-' . get_class($this) . '-' . $this->getIdentifier();
 			return $this->cache->getPackageFilename($this, $identifier, $sha, $repositoryDir, $log);

 		// Default, cacheless implementation
 		} else {
 			$filename = TEMP_FOLDER . '/' . $sha . '.tar.gz';
 			if($this->generatePackage($sha, $repositoryDir, $outputFilename, $log)) {
 				return $filename;
 			}
 		}
	}

}
