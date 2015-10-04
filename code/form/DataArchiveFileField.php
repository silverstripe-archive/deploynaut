<?php

/**
 * Class DataArchiveFileField
 *
 * Overwrite field to save into a {@link DataArchive}, using generateFilepath().
 * This mainly just works around the limitation
 * of FileField to set the folder path *before* uploading the file,
 * at which point we don't have a {@link DataTransfer} ID yet, so can't generate the path.
 */
class DataArchiveFileField extends FileField {

	/**
	 * @param DataObjectInterface $record
	 * @return bool|DataArchiveFileField
	 */
	public function saveInto(DataObjectInterface $record) {
		if(!isset($_FILES[$this->name])) {
			return false;
		}

		if(!($record instanceof DNDataArchive)) {
			throw new LogicException('Saving into wrong type, expected DNDataArchive');
		}

		$dataArchive = $record;

		/** @var DNDataTransfer $dataTransfer */
		$dataTransfer = $dataArchive->DataTransfers()->First();
		if(!$dataTransfer) {
			throw new LogicException('No transfer found');
		}

		$fileClass = File::get_class_for_file_extension(pathinfo($_FILES[$this->name]['name'], PATHINFO_EXTENSION));
		$file = new $fileClass();
		// Hack: loadIntoFile assumes paths relative to assets,
		//  otherwise it creates the whole structure *within* that folder
		$absolutePath = $dataArchive->generateFilepath($dataTransfer);
		$relativePath = preg_replace('#^' . preg_quote(ASSETS_PATH) . '/#', '', $absolutePath);
		$this->upload->loadIntoFile($_FILES[$this->name], $file, $relativePath);
		if($this->upload->isError()) {
			return false;
		}

		$file = $this->upload->getFile();
		if($this->relationAutoSetting) {
			// save to record
			$record->{$this->name . 'ID'} = $file->ID;
		}

		return $this;
	}
}
