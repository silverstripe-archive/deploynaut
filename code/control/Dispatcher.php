<?php

abstract class Dispatcher extends DNRoot {

	abstract public function getRelativeStaticPath();

	public function init() {
		parent::init();
		$this->includeFrontend();
	}

	public function getReactComponent($name) {
		$modelName = sprintf('get%sModel', $name);
		if ($this->hasMethod($modelName)) {
			$model = $this->$modelName();
		} else {
			$model = [];
		}
		$model['InitialSecurityID'] = $this->getSecurityToken()->getValue();

		return $this->customise([
			'Name' => $name,
			'Model' => htmlentities(json_encode($model))
		])->renderWith('ReactTemplate');
	}

	protected function getSecurityToken() {
		return new \SecurityToken(sprintf('%sSecurityID', $this->class));
	}

	protected function checkSecurityToken() {
		$securityToken = $this->getSecurityToken();
		if(!$securityToken->check($this->request->postVar('SecurityID'))) {
			$this->httpError(400, 'Invalid security token, try reloading the page.');
		}
	}

	/**
	 * Convert validator errors to JSON response.
	 * [{"fieldName":"Name","message":"Message.","messageType":"bad"}]
	 *
	 * @return \SS_HTTPResponse
	 */
	public function asJSONValidatorErrors($code, $validatorErrors) {
		$fieldErrors = [];
		foreach ($validatorErrors as $error) {
			$fieldErrors[$error['fieldName']] = $error['message'];
		}
		return $this->asJSONFormFieldErrors($code, $fieldErrors);
	}

	/**
	 * Return field-specific errors.
	 *
	 * @param int $code HTTP status code.
	 * @param array $fieldErrors FieldName => message structure.
	 * @return \SS_HTTPResponse
	 */
	public function asJSONFormFieldErrors($code, $fieldErrors) {
		$response = $this->getResponse();
		$response->addHeader('Content-Type', 'application/json');
		$response->setBody(json_encode([
			'InputErrors' => $fieldErrors
		]));
		$response->setStatusCode($code);
		return $response;

	}

	public function asJSON($data) {
		$securityToken = $this->getSecurityToken();
		$securityToken->reset();
		$data['NewSecurityID'] = $securityToken->getValue();

		$response = $this->getResponse();
		$response->addHeader('Content-Type', 'application/json');
		$response->setBody(json_encode($data));
		$response->setStatusCode(200);
		return $response;
	}

	/**
	 * Include the javascript and CSS for this controller
	 *
	 * TODO this is questionable because it relies on a certain layout of the gulpfile builder.
	 */
	protected function includeFrontend() {
		if(\Director::isDev()) {
			\Requirements::javascript(sprintf('%s/bundle-debug.js', $this->getRelativeStaticPath()));
		} else {
			\Requirements::javascript(sprintf('%s/bundle.js', $this->getRelativeStaticPath()));
		}

		\Requirements::css(sprintf('%s/style.css', $this->getRelativeStaticPath()));
	}

}
