<?php
class DeploynautFileExtension extends DataExtension {
	/**
	 * If this file is attached to a {@link DNDataArchive}, then we need to check security permissions, to ensure the
	 * currently logged in {@link Member} can download the file.
	 *
	 * This uses the secureassets module to provide the security of these assets.
	 */
	public function canDownload() {
		$member = Member::currentUser();
		$file = $this->owner;
		$archive = DNDataArchive::get()->filter('ArchiveFileID', $file->ID)->First();

		if($archive) {
			return $archive->canDownload($member);
		}

		return true; // By default, files can be downloaded from assets/ normally
	}
}