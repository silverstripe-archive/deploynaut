<?php

abstract class DeploynautJob implements DeploynautJobInterface {

	/**
	 * {@inheritdoc}
	 */
	public function onFailure(Exception $exception) {
		$this->updateStatus('Failed');
	}

	abstract protected function updateStatus($status);

}
