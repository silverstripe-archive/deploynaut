<?php
/**
 * Class SS_Datetimezone
 *
 * Adds customisable timezones to the nice method on {@link SS_Datetime}.
 */
class SS_Datetimezone extends SS_Datetime {
	/**
	* Returns the date in the raw SQL-format specific to a given timezone passed from the Member class, e.g. “2006-01-18 16:32:04”
	*/
	public function Format($format) {
		if($this->value){
			$date = new DateTime($this->value);
			//if the current user has set a timezone that is not the default then use that
			$member = Member::currentUser();
			if ($member && $member->exists() && $member->Timezone && $member->Timezone != date_default_timezone_get()) {
				$date->setTimezone(new DateTimeZone($member->Timezone));    
			}
			return $date->Format($format);
		}
	}
}