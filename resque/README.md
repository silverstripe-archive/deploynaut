# SilverStripe Resque

This modules wraps php-resque to be able to make scheduled background jobs in sweet harmony with redis.

_Still in development_

# Installation

## Install redis

Via homebrew:

	$ brew install redis
	
Or by compiling it, see [Redis Quick Start](http://redis.io/topics/quickstart) for more information.

	$ sudo mkdir -p /usr/local/src
	$ cd /usr/local/src
	$ sudo wget http://download.redis.io/redis-stable.tar.gz
	$ sudo tar xvzf redis-stable.tar.gz
	$ cd redis-stable
	$ sudo make
	$ sudo make install
	
There are most likely a suitable packages in your prefered linux distribution (untested).

[Search google](https://www.google.co.nz/search?q=install+redis+apt+yum)

## Silverstripe Resque

	$ git clone git@github.com:stojg/silverstripe-resque.git resque

# Usage

Start the redis server:

	$ redis-server
	
Start the one worker for all queues in another terminal window

	$ ./framework/sake dev/resque/run queue=*

In another terminal window, try creating a ping job

	$ ./framework/sake dev/resque/ping

In the worker terminal you should now see something similar to

	Ping: 2012-11-15 10:51:29 from hostname
	
# Credits

Following is the giants where I've started f

- [Chris Boulton](https://github.com/chrisboulton/php-resque) for PHP resque
- [defunkt](https://github.com/defunkt/resque/) the original resque for ruby
- [redis](http://redis.io/) for providing an awesome, stable and fast key value store
- [SilverStripe](http://www.silverstripe.org/) The place where I get paid to do stuff like this.