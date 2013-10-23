<?php

class APIProject extends APINoun {

	/**
	 * 
	 * @param SS_HTTPRequest $request
	 * @return SS_HTTPResponse
	 */
	public function index(SS_HTTPRequest $request) {
		return $this->httpError(404, '404 - These aren\'t the droids you\'re looking for.');
	}
}
