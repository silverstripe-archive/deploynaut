<?php

/**
 * Class for calling the package generator and caching the results.
 */
class SizeRestrictedPackageCache implements PackageCache {

	protected $cacheSize;
	protected $baseDir;

	/**
	 * Set the maximum number of items that will be stored in the package cache.
	 *
	 * If null, items will never be deleted. If set, cache entries will be touched whenever they are accessed,
	 * and the least-recently-access items will be deleted.
	 *
	 * @param int $cacheSize the number of package files to keep.
	 */
	public function setCacheSize($cacheSize) {
		$this->cacheSize = $cacheSize;
	}

	/**
	 * The base directory to store cached packages in.
	 * The files will be stored in a subdirectory named after the identifier.
	 * If base directory isn't set, the getPackageFilename() won't run.
	 *
	 * @param string $baseDir The base directory
	 */
	public function setBaseDir($baseDir) {
		$this->baseDir = realpath($baseDir);
	}

	/**
	 * Return the filename of the generated package, retrieving from cache or generating as necessary
	 *
	 * @param PackageGenerator $generator The generator to use to create cache entries.
	 * @param string $identifier A unique identifier for the generator; used to partition the cache
	 * @param string $sha The SHA of the commit to be deployed
	 * @param string $repositoryDir The directory where the repository resides
	 * @param DeploynautLogFile $log The log to write status output to, including package-generation commands
	 *
	 * @return string
	 */
	public function getPackageFilename(
		PackageGenerator $generator,
		$identifier, $sha,
		$repositoryDir,
		DeploynautLogFile $log
	) {
		if(!$this->baseDir) {
			throw new \LogicException("Can't use PackageCache without setting BaseDir");
		}

		$buildPath = $this->baseDir . '/' . $this->sanitiseDirName($identifier);
		$filename = "$buildPath/$sha.tar.gz";

		if(!file_exists($this->baseDir)) {
			if(!mkdir($this->baseDir)) {
				throw new \LogicException("Can't create base dir {$this->baseDir}");
			}
		}
		if(!file_exists($buildPath)) {
			if(!mkdir($buildPath)) {
				throw new \LogicException("Can't create build path $buildPath");
			}
		}

		if(file_exists($filename)) {
			$log->write("Using previously generated package $filename");
			// This will ensure that our cache garbage collection will remove least-recently-accessed,
			// rather than oldest.
			touch($filename);
			return $filename;

		} else {
			if($this->cacheSize) {
				$this->reduceDirSizeTo($buildPath, $this->cacheSize - 1, $log);
			}

			if($generator->generatePackage($sha, $repositoryDir, $filename, $log)) {
				return $filename;
			}
		}
	}

	/**
	 * Take the identifier an make it safe to use as a directory name.
	 *
	 * @param string $identifier The unsanitised directory name.
	 */
	protected function sanitiseDirName($identifier) {
		$safe = preg_replace('/[^A-Za-z0-9_-]/', '', $identifier);
		return $safe ? $safe : 'null';
	}

	/**
	 * Delete items in this directory until the number of items is <= $count.
	 * Delete the oldest files first.
	 *
	 * @param string $dir The directory to remove items from
	 * @param int $count The maximum number of .tar.gz files that can appear in that directory
	 * @param DeploynautLogFile $log The log to send removal status messages to
	 */
	protected function reduceDirSizeTo($dir, $count, DeploynautLogFile $log) {
		$files = glob($dir . '/*.tar.gz');
		if(sizeof($files) > $count) {
			usort($files, function($a, $b) {
				return filemtime($a) > filemtime($b);
			});

			for($i = 0; $i < sizeof($files) - $count; $i++) {
				$log->write("Removing " . $files[$i] . " from package cache");
				unlink($files[$i]);
			}
		}
	}
}
