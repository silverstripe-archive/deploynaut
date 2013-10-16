<?php

class GraphiteProxy extends Controller {
	public static $graphite_source = 'http://graphite.silverstripe.com/render';

	public static $url_handlers = array(
		'render' => 'renderGraph',
	);

	public static $allowed_actions = array(
		'renderGraph',
	);

	public function renderGraph() {
		if(!Member::currentUser()) throw new SS_HTTPResponse_Exception('Please log-in to see graphs', 403);

		$getVars = $this->request->getVars();

		// We can't rely on get vars because graphite uses multiple getvars of the samee name
		$queryString = preg_replace('/url=[^&]+&/','', $_SERVER['QUERY_STRING']);
		$destURL = $this->config()->graphite_source . '?' . $queryString;

		$response = $this->curlRequest($destURL, 'get');
		$response->removeHeader('Server');
		$response->removeHeader('Vary');
		$response->removeHeader('Pragma');
		$response->removeHeader('Cache-Control');

		//Debug::dump($response);

		header("Content-type: image/png");
		echo $response->getBody();

		$response->output();
	}

	/**
	 * Use cURL to request a URL, and return a SS_HTTPResponse object.
	 */
	protected function curlRequest($url, $method, $data = null, $headers = null, $curlOptions = array()) {
		$ch        = curl_init();
		$timeout   = 5;
		$ssInfo = new SapphireInfo;
		$useragent = 'SilverStripe/' . $ssInfo->version();

		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_USERAGENT, $useragent);
		curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
		curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
		curl_setopt($ch, CURLOPT_HEADER, 1);

		if($headers) curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

		// Add fields to POST and PUT requests
		if($method == 'POST') {
			curl_setopt($ch, CURLOPT_POST, 1);
			curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
		} elseif($method == 'PUT') {
			$put = fopen("php://temp", 'r+');
			fwrite($put, $data);
			fseek($put, 0);

			curl_setopt($ch, CURLOPT_PUT, 1);
			curl_setopt($ch, CURLOPT_INFILE, $put);
			curl_setopt($ch, CURLOPT_INFILESIZE, strlen($data));
		}

		// Follow redirects
		curl_setopt($ch, CURLOPT_FOLLOWLOCATION, TRUE);

		// Set any custom options passed to the request() function
		curl_setopt_array($ch, $curlOptions);

		// Run request
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
		$fullResponseBody = curl_exec($ch);
		$curlError = curl_error($ch);


		list($responseHeaders, $responseBody) = preg_split('/(\n\r?){2}/', $fullResponseBody, 2);
		if(preg_match("#^HTTP/1.1 100#", $responseHeaders)) {
			list($responseHeaders, $responseBody) = preg_split('/(\n\r?){2}/', $responseBody, 2);
		}


		$responseHeaders = explode("\n", trim($responseHeaders));
		array_shift($responseHeaders);

		$statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		if($curlError !== '' || $statusCode == 0) $statusCode = 500;

		$response = new SS_HTTPResponse($responseBody, $statusCode);
		foreach($responseHeaders as $headerLine) {
			if(strpos($headerLine, ":") !== false) {
				list($headerName, $headerVal) = explode(":", $headerLine, 2);

				// This header isn't relevant outside of curlRequest
				if(strtolower($headerName) == 'transfer-encoding') continue;

				$response->addHeader(trim($headerName), trim($headerVal));
			}
		}

		curl_close($ch);

		return $response;
	}

}
