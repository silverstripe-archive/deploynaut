<?php
/**
 * Base class for the APINouns
 */
class APINoun extends Controller {
	
	/**
	 *
	 * @var controller
	 */
	protected $parent = null;
	
	/**
	 *
	 * @var DataObject
	 */
	protected $record = null;
	
	/**
	 *
	 * @var Member
	 */
	protected $member = null;
	
	/**
	 * Holds the url segment for this admin
	 *
	 * @param Controller $parent
	 * @param DataObject $record
	 */
	public function __construct(\Controller $parent = null, DataObject $record = null) {
		$this->record = $record;
		$this->parent = $parent;
		parent::__construct();
	}
	
	/**
	 * Enable basic auth on the API
	 */
	public function init() {
		$this->member = BasicAuth::requireLogin('Deploynaut API');
		parent::init();
	}
	
	/**
	 * 
	 * @return DataObject
	 */
	public function getRecord() {
		return $this->record;
	}
	
	/**
	 * 
	 * @return Member
	 */
	public function getMember() {
		return $this->member;
	}
}
