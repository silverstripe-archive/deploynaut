<?php
/**
 * Dispatcher provides functionality to make it easier to work with frontend React components.
 *
 * First, create your own dispatcher:
 *	class Dispatcher extends \Dispatcher {...}
 *
 * Then render a template:
 *	$getReactComponent(SomeForm)
 *
 * Provide initial model:
 *  public function getSomeFormModel() {
 *      return [
 *          'Key' => 'Value'
 *      ];
 *  }
 *
 * Then hook up JS. This will automatically make the model available as this.props.model, and render the component
 * in the spot specified in the template:
 *	var Tools = require('../../deploynaut/js/tools.jsx');
 *	var TrialStackCreator = require('./SomeForm.jsx');
 *  Tools.install(SomeForm, 'SomeForm');
 */

abstract class Dispatcher extends DNRoot {

	/**
	 * Specify path where your gulp outputs live.
	 */
	abstract public function getRelativeStaticPath();

	public function init() {
		parent::init();
		$this->includeFrontend();
	}

	/**
	 * Renders the initial HTML needed to bootstrap the react component.
	 *
	 * Usage: $getReactComponent(YourFormOrWhatever);
	 *
	 * @param string $name Used to name the DOM elements and obtain the initial model.
	 * @return string A snippet good for adding to a SS template.
	 */
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

	protected function getSecurityToken($name = null) {
		if(is_null($name)) $name = sprintf('%sSecurityID', get_class($this));
		return new \SecurityToken($name);
	}

	protected function checkSecurityToken($name = null) {
		if(is_null($name)) $name = sprintf('%sSecurityID', get_class($this));
		$securityToken = $this->getSecurityToken($name);
		if(!$securityToken->check($this->request->postVar($name))) {
			$this->httpError(400, 'Invalid security token, try reloading the page.');
		}
	}

	/**
	 * Convert validator errors to JSON response.
	 * [{"fieldName":"Name","message":"Message.","messageType":"bad"}]
	 *
	 * @param int $code HTTP status code.
	 * @param array $validatorErrors Result of calling Validator::validate
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

	/**
	 * Return JSON response, good for responding to AJAX requests.
	 * It will magically update the security token and proxy pending redirects.
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
	 * Include the javascript and CSS for this controller
	 *
	 * TODO this is questionable because it relies on a certain layout of the gulpfile builder.
	 */
	protected function includeFrontend() {
		\Requirements::css(sprintf('%s/style.css', $this->getRelativeStaticPath()));
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
	 * @return string
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
	 * @return string
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
