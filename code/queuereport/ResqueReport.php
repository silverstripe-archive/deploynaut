<?php

class ResqueReport extends LeftAndMain {

	/**
	 * @var string
	 */
	public static $url_segment = 'resque';

	/**
	 * @var string
	 */
	public static $url_rule = '/$ModelClass/$Action';

	/**
	 * @var string
	 */
	public static $menu_title = 'Resque Report';

	/**
	 * @var array
	 */
	public static $allowed_actions = array(
		'EditForm',
	);

	/**
	 *
	 * @param int|null $id
	 * @param array|null $fields
	 * @return \Form
	 */
	public function getEditForm($id = null, $fields = null) {
		$queues = $this->getQueues();

		$gridField = new GridField('Queues', 'Queues', $queues, new GridFieldConfig_RecordEditor());
		$dataComponent = $gridField->getConfig()->getComponentByType('GridFieldDataColumns');
		$dataComponent->setDisplayFields(array(
			'Name' => 'Name',
			'Size' => 'Size',
		));

		$form = new Form($this, 'EditForm', new FieldList($gridField), new FieldList());
		$form->addExtraClass('cms-edit-form cms-panel-padded center');
		$form->setAttribute('data-pjax-fragment', 'CurrentForm');
		$form->setTemplate($this->getTemplatesWithSuffix('_EditForm'));
		$form->setAttribute('data-pjax-fragment', 'CurrentForm');
		return $form;
	}

	/**
	 * @return ArrayList
	 */
	protected function getQueues() {
		$queues = Resque::queues();
		$queueList = new ArrayList();
		foreach($queues as $idx => $queue) {
			$queueList->push(new ResqueQueue(array(
				'ID' => ($idx + 1),
				'Name' => $queue,
				'Size' => Resque::size($queue)
			)));
		}
		return $queueList;
	}
}
