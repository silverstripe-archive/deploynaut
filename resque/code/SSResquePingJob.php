<?php 

class SSResquePingJob {

	public function perform() {
		echo 'Ping: '.$this->args['time'].' '.$this->args['message'].PHP_EOL;
	}

}