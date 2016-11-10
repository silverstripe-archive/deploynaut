<?php
/**
 * Class SS_Datetimezone
 *
 * Adds customisable timezones to the nice method on {@link SS_Datetime}.
 */
class SS_Datetimezone extends SS_Datetime {

	/**
	 * @var \Member[]
	 */
	protected static $_cache_members = [];

	/**
	* Returns the date in the raw SQL-format specific to a given timezone passed from the Member class, e.g. “2006-01-18 16:32:04”
	*/
	public function Format($format) {
		if($this->value){
			$date = new DateTime($this->value);
			//if the current user has set a timezone that is not the default then use that
			$member = $this->getCurrentCachedUser();
			if ($member && $member->exists() && $member->Timezone && $member->Timezone != date_default_timezone_get()) {
				$date->setTimezone(new DateTimeZone($member->Timezone));
			}
			return $date->Format($format);
		}
	}

	/**
	 * Format can be called a lot of time in tight loops, so we cache the current user
	 * per request
	 *
	 * @return \Member|null
	 */
	protected function getCurrentCachedUser() {
		$memberID = \Member::currentUserID();
		if(!$memberID) {
			return null;
		}
		if(!isset(self::$_cache_members[$memberID])) {
			self::$_cache_members[$memberID] = Member::get()->byId($memberID);
		}
		return self::$_cache_members[$memberID];
	}
}
