<?php

class ProjectMemberExtension extends DataExtension {

	/**
	 * @var array
	 */
	private static $belongs_many_many  = array(
		'StarredProjects' => 'DNProject'
	);

}
