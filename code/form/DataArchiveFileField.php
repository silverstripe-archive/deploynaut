<?php
/**
 * Overwrite field to save into a {@link DataArchive}, using generateFilepath().
 * This mainly just works around the limitation
 * of FileField to set the folder path *before* uploading the file,
 * at which point we don't have a {@link DataTransfer} ID yet, so can't generate the path.
 */
class DataArchiveFileField extends FileField {

	public function saveInto(DataObjectInterface $record) {
		if(!isset($_FILES[$this->name])) return false;

		if(!($record instanceof DNDataArchive)) {
			throw new LogicException('Saving into wrong type, expected DNDataArchive');
		}

		$dataArchive = $record;

		$dataTransfer = $dataArchive->DataTransfers()->First();
		if(!$dataTransfer) {
			throw new LogicException('No transfer found');
		}

		$fileClass = File::get_class_for_file_extension(pathinfo($_FILES[$this->name]['name'], PATHINFO_EXTENSION));
		$file = new $fileClass();
		$this->upload->loadIntoFile($_FILES[$this->name], $file, $dataArchive->generateFilepath($dataTransfer));
		if($this->upload->isError()) return false;

		return $this;
	}
}