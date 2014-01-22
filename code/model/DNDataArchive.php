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

}