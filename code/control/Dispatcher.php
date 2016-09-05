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
	 * The CSRF token name that is used for all frondend dispatchers
	 */
	const SECURITY_TOKEN_NAME = 'DispatcherSecurityID';

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

	/**
	 * We want to separate the dispatchers security token from the static HTML
	 * security token since it's possible that they get out of sync with eachother.
	 *
	 * We do this by giving the token a separate name.
	 *
	 * Don't manually reset() this token, that will cause issues when people have
	 * several tabs open. The token will be recreated when the user session times
	 * out.
	 *
	 * @return SecurityToken
	 */
	protected function getSecurityToken() {
		return new \SecurityToken(self::SECURITY_TOKEN_NAME);
	}

	/**
	 * @see getSecurityToken()
	 */
	protected function checkSecurityToken() {
		$securityToken = $this->getSecurityToken();
		if(!$securityToken->check($this->request->postVar(self::SECURITY_TOKEN_NAME))) {
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
	 * @deprecated the use of getAPIResponse() is encouraged
	 * @param array $data Data to be passed to the frontend.
	 *
	 * @return SS_HTTPResponse
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
	 * Return an XHR response object without any CSRF token information
	 *
	 * @param array $output
	 * @param int $statusCode
	 * @return SS_HTTPResponse
	 */
	protected function getAPIResponse($output, $statusCode) {
		$output['status_code'] = $statusCode;
		$response = $this->getResponse();
		$response->addHeader('Content-Type', 'application/json');
		$response->setBody(json_encode($output, JSON_PRETTY_PRINT));
		$response->setStatusCode($statusCode);
		return $response;
	}

	/**
	 * Decode the data submitted by the Form.jsx control.
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
