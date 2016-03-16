<?php
/**
 * Dispatcher provides functionality to make it easier to work with frontend React components.
 * See deploynaut/docs/dispatcher.md for more information.
 *
 * @todo: currently we can't have more than one component mounted in parallel on any given Dispatcher,
 * because the SecurityID will diverge as soon as one of these components submit.
 */

abstract class Dispatcher extends DNRoot {

	/**
	 * Generate the data structure used by the frontend component.
	 *
	 * @param string $name of the component
	 * @return array
	 */
	abstract public function getModel($name);

	/**
	 * Renders the initial HTML needed to bootstrap the react component.
	 *
	 * Usage: $getReactComponent(YourComponent);
	 *
	 * @param string $name Used to name the DOM elements and obtain the initial model.
	 * @return string A snippet good for adding to a SS template.
	 */
	public function getReactComponent($name) {
		$model = $this->getModel($name);
		$model['InitialSecurityID'] = $this->getSecurityToken()->getValue();

		return $this->customise([
			'Name' => $name,
			'Model' => htmlentities(json_encode($model))
		])->renderWith('ReactTemplate');
	}

	protected function getSecurityToken($name = null) {
		if(is_null($name)) $name = sprintf('%sSecurityID', get_class($this));
		return new \SecurityToken($name);
	}

	protected function checkSecurityToken($name = null) {
		$postVar = is_null($name) ? 'SecurityID' : $name;
		if(is_null($name)) $name = sprintf('%sSecurityID', get_class($this));
		$securityToken = $this->getSecurityToken($name);

		// By default the security token is always represented by a "SecurityID" post var,
		// even if the backend uses different names for the token. This too means only one security token
		// can be managed by one dispatcher if the default is used.
		if(!$securityToken->check($this->request->postVar($postVar))) {
			$this->httpError(400, 'Invalid security token, try reloading the page.');
		}
	}

	/**
	 * Return the validator errors as AJAX response.
	 *
	 * @param int $code HTTP status code.
	 * @param array $validatorErrors Result of calling Validator::validate, e.g.
	 *	[{"fieldName":"Name","message":"Message.","messageType":"bad"}]
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
	 * Return field-specific errors as AJAX response.
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

	/**
	 * Respond to an AJAX request.
	 * Automatically updates the security token and proxy pending redirects.
	 *
	 * @param array $data Data to be passed to the frontend.
	 */
	public function asJSON($data = []) {
		$securityToken = $this->getSecurityToken();
		$securityToken->reset();
		$data['NewSecurityID'] = $securityToken->getValue();

		$response = $this->getResponse();

		// If we received an AJAX request, we can't redirect in an ordinary way: the browser will
		// interpret the 302 responses internally and the response will never reach JS.
		//
		// To get around that, upon spotting an active redirect, we change the response code to 200,
		// and move the redirect into the "RedirectTo" field in the JSON response. Frontend can
		// then interpret this and trigger a redirect.
		if ($this->redirectedTo()) {
			$data['RedirectTo'] = $this->response->getHeader('Location');
			// Pop off the header - we are no longer redirecting via the usual mechanism.
			$this->response->removeHeader('Location');
		}

		$response->addHeader('Content-Type', 'application/json');
		$response->setBody(json_encode($data));
		$response->setStatusCode(200);
		return $response;
	}

	/**
	 * Decode the data submitted by the form.jsx control.
	 *
	 * @return array
	 */
	protected function getFormData() {
		return $this->stripNonPrintables(json_decode($this->request->postVar('Details'), true));
	}

	/**
	 * @param string|array
	 * @return string|array
	 */
	protected function trimWhitespace($val) {
		if(is_array($val)) {
			foreach($val as $k => $v) $val[$k] = $this->trimWhitespace($v);
			return $val;
		} else {
			return trim($val);
		}
	}

	/**
	 * Remove control characters from the input.
	 *
	 * @param string|array
	 * @return string|array
	 */
	protected function stripNonPrintables($val) {
		if(is_array($val)) {
			foreach($val as $k => $v) $val[$k] = $this->stripNonPrintables($v);
			return $val;
		} else {
			return preg_replace('/[[:cntrl:]]/', '', $val);
		}
	}

}
