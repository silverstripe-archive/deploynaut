# REST API

__This API is not production ready, more of a preview of things to come.__

## Resources

### Schedule a deploy 

Create a deploy (actually schedule one).

API

	POST naut/api/:projectname/:environmentname/deploy

Request Body:
	
	{"release": "SHA1"}

Response:

	HTTP/1.1 201 Created
	Location: http://deploynaut.test.silverstripe.com/naut/api/:projectname/:environmentname/deploy/:id

	Array
	(
	    [message] => Deploy queued as job 68a09c440579d60415ac40f917a1074b
	    [href] => http://deploynaut.test.silverstripe.com/naut/api/:projectname/:environmentname/deploy/29
	)

Example:

	curl -i -u username:password -X POST -d '{"release":"6960afd15be4c7496e4d1d5bc07cafd5326a6d62"}' http://deploynaut.test.silverstripe.com/naut/api/naut1/staging/deploy

### View status of a deploy

API

	GET naut/api/:projectname/:environmentname/deploy/:id

Response:

	HTTP/1.1 200 OK

	Array
	(
		[status] => Running
		[message] => [2013-10-30 17:14:58] Deploying "6960afd15be4c7496e4d1d5bc07cafd5326a6d62" to "{naut1}:staging"
		[2013-10-30 17:14:58] Deploy queued as job 8561fd1a338f763170d278da2ba5252a
	)

Example:

	curl -i -u username:password http://deploynaut.test.silverstripe.com/naut/api/naut1/staging/deploy/28

## Ping

Checks if the underlying capistrano can reach and that the necessary folders exists

### Schedule a ping

API

	POST naut/api/:projectname/:environmentname/ping/

Response

	HTTP/1.1 201 Created
	Location: http://deploynaut.test.silverstripe.com/naut/api/:projectname/:environmentname/ping/16

	Array
	(
		[message] => Ping queued as job b7aca5172bd0a9734f7e4fa79a4f8c77
		[href] => http://deploynaut.test.silverstripe.com/naut/api/:projectname/:environmentname/ping/18
	)

Example

	curl -i -u username:password -X POST http://deploynaut.test.silverstripe.com/naut/api/naut1/staging/ping


### View status of a ping

API

	GET naut/api/:projectname/:environmentname/ping/:id

Response
	
	HTTP/1.1 200 OK

	Array
	(
		[status] => Invalid
		[message] => [2013-10-24 15:23:26] Pinging  "naut1:staging"
		[2013-10-24 15:23:26] Ping queued as job dd125e6b89d4f1e3ebbc47f11d5568cd
		[2013-10-24 15:23:26]   * executing `naut1:staging'

		[2013-10-24 15:23:26]   * executing `multiconfig:ensure'

		[2013-10-24 15:23:26]   * executing `deploy:check'

		[2013-10-24 15:23:26]   * executing "test -d /sites/naut1-staging/releases"

		[2013-10-24 15:23:27]   * executing "test -w /sites/naut1-staging"

		[2013-10-24 15:23:27]   * executing "test -w /sites/naut1-staging/releases"

		[2013-10-24 15:23:27]   * executing "which tar"

		[2013-10-24 15:23:27] You appear to have all necessary dependencies installed
	)


Example

	curl -i -u username:password http://deploynaut.test.silverstripe.com/naut/api/naut1/staging/ping/12

## View an environments internal state

_NOTE_ This API is volatile and prone to change, just listed for brevity.

API

	naut/api/:projectname/:environmentname/

Response:

	Array
	(
		[ClassName] => DNEnvironment
		[Created] => 2013-08-14 16:34:29
		[LastEdited] => 2013-10-25 15:51:24
		[Filename] => staging.rb
		[Name] => staging
		[URL] => http://staging1.nauttest.silverstripe.com
		[GraphiteServers] => server.wgtn.oscar
		[ProjectID] => 1
		[ID] => 2
		[RecordClassName] => DNEnvironment
	)

Example:

	curl -i -u username:password http://deploynaut.test.silverstripe.com/naut/api/naut1/staging/

## Response types

By default the response is formated as JSON.

### JSON 

By appending .json to the URL or setting the Accept header to text/json

### Plain text 

By appending .txt to the URL or setting the Accept header to text/plain

## Authentication

The authentication is using basic auth, and needs a username and password with an account that have access to the relevant call. The permissions needed are the same as the current website.

Example:

	curl -u username:password http://deploynaut.test.silverstripe.com/naut/api/naut1/staging
