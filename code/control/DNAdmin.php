<?php

class DNAdmin extends ModelAdmin {

	/**
	 * @var string
	 */
	public static $menu_title = "Deploynaut Projects";

	/**
	 * @var string
	 */
	public static $url_segment = "naut";

	/**
	 * @var array
	 */
	public static $managed_models = [
		'DNProject' => ['title' => 'Projects'],
		'DNDataTransfer' => ['title' => 'Transfers'],
		'DNDataArchive' => ['title' => 'Archives'],
	];

	/**
	 * @var int
	 */
	private static $menu_priority = 100;

	public function getEditForm($id = null, $fields = null) {
		$form = parent::getEditForm($id, $fields);
		$gridField = $form->Fields()->dataFieldByName('DNProject');
		if ($gridField) {
			$gridField->getConfig()
				->removeComponentsByType('GridFieldExportButton')
				->removeComponentsByType('GridFieldPrintButton')
				->removeComponentsByType('GridFieldAddNewButton')
				->addComponent(new GridFieldAddNewMultiClass('buttons-before-left'))
				->addComponent(new GridFieldExportButton('buttons-before-right'))
				->addComponent(new GridFieldPrintButton('buttons-before-right'));
		}
		return $form;
	}

}
