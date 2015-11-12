<?php

interface DeploynautEventInterface extends \League\Event\EventInterface {

	/**
	 * Should return the event name, e.g 'event.name'
	 *
	 * @return string
	 */
	public function getName();

	/**
	 * Get the value for the $keyname or empty string
	 *
	 * @param string $keyname
	 *
	 * @return string
	 */
	public function get($keyname);

	/**
	 * @return array
	 */
	public function asArray();

	/**
	 * @return string - returns the data as json
	 */
	public function asJSON();

}
