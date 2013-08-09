<?php

/**
 * Helper class caching expensive gitonomy calls
 */
class GitonomyCache {
	static $cache = array();	

	static function getIncludingBranches($commit) {
		$cacheKey = 'getIncludingBranches-' .$commit->getRepository()->getPath() . '-' . $commit->gethash();
		if(!isset(self::$cache[$cacheKey])) {
			self::$cache[$cacheKey] = $commit->getIncludingBranches();
		}
		return self::$cache[$cacheKey];
	}
}