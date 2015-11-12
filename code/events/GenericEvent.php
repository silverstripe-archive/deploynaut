<?php

use League\Event\AbstractEvent;

/**
 * Class GenericEvent
 *
 * This class is a data structure for generic event data, it should be used like this
 *
 * $emitter = Injector::inst()->get('EventEmitter');
 * $emitter->emit(GenericEvent::create('event.name', [
 *   'random_data' => '1234',
 *   'some_more' => '5678',
 * ]));
 *
 * Then a listener can subscribe the event like this (_config.php):
 *
 * $emitter = Injector::inst()->get('EventEmitter');
 * $emitter->addListener('event.name', new DomainListener());
 *
 * See more on how to use the event system here: http://event.thephpleague.com/2.0/
 */
class GenericEvent extends AbstractEvent implements DeploynautEventInterface {

	/**
	 * @var string
	 */
	protected $name = '';

	/**
	 * @var array
	 */
	protected $data = [];

	/**
	 * @param string $name - event name
	 * @param array $data
	 *
	 * @return GenericEvent
	 */
	public static function create($name, array $data) {
		return Injector::inst()->createWithArgs(get_called_class(), [$name, $data]);
	}

	/**
	 * Event constructor
	 *
	 * @param string $eventName - e.g. 'event.name'
	 * @param array $data
	 */
	public function __construct($eventName, array $data) {
		$this->name = $eventName;
		$this->data = $data;
	}

	/**
	 * get the event name, e.g 'event.name'
	 *
	 * @return string
	 */
	public function getName() {
		return $this->name;
	}

	/**
	 * Get the value for the $keyname or empty string
	 *
	 * @param string $keyname
	 *
	 * @return string
	 */
	public function get($keyname) {
		if(array_key_exists($keyname, $this->data)) {
			return $this->data[$keyname];
		}
		return '';
	}

	/**
	 * return all the data as an array, including the event name as 'event';
	 *
	 * @return array
	 */
	public function asArray() {
		$payload = $this->data;
		$payload['event'] = $this->getName();
		return $payload;
	}

	/**
	 * return all the data as a JSON string, including the event name as 'event';
	 *
	 * @return string - returns the data as json
	 */
	public function asJSON() {
		return json_encode($this->asArray());
	}
}
