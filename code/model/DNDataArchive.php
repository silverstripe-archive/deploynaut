<?php
/**
 * Represents a file archive of database and/or assets extracted from
 * a specific Deploynaut environment.
 *
 * The model can also represent a request to upload a file later,
 * through offline processes like mailing a DVD. In order to associate
 * and authenticate those requests easily, an upload token is generated for every archive.
 */
class DNDataArchive extends DataObject {

	private static $db = array(
		// Relative file path to the data which was backed up or used for a restore.
		"Filepath" => 'Varchar(1024)',
		'UploadToken' => 'Varchar(8)',
	);

	private static $has_one = array(
		'Environment' => 'DNEnvironment',
	);

	public function getAbsolutePath() {
		// TODO Figure out storage location
	}

	/**
	 * Calculates and returns a human-readable size of this archive file. If the file exists, it will determine
	 * whether to display the output in bytes, kilobytes, megabytes, gigabytes, terabytes or petabytes.
	 * 
	 * @return string The human-readable size of this archive file
	 */
	public function FileSize() {
		if($this->Filepath && file_exists($this->Filepath) && is_readable($this->Filepath)) {
			$size = filesize($this->Filepath);

			$suffix = 'BKMGTP'; // byes, kilobytes, megabytes, gigabytes, terabytes, petabytes
			$factor = floor((strlen($size) - 1) / 3); // Are we dealing with a size in bytes, KB, MB, GB etc.
			return sprintf("%d %s", ($size / pow(1024, $factor)), substr($suffix, $factor, 1));
		} else {
			return "N/A";
		}
	}

	/**
	 * @param Member|null $member The {@link Member} object to test against.
	 * @return true if $member (or the currently logged in member if null) can upload this archive
	 */
	public function canUpload($member = null) {
		return $this->Environment()->canUploadArchive($member);
	}

	/**
	 * @param Member|null $member The {@link Member} object to test against.
	 * @return true if $member (or the currently logged in member if null) can download this archive
	 */
	public function canDownload($member = null) {
		return $this->Environment()->canDownloadArchive($member);
	}

}