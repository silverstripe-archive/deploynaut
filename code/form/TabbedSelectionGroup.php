<?php

class TabbedSelectionGroup extends SelectionGroup {

	public function FieldList() {
		$items = CompositeField::FieldList()->toArray();
		$fields = new ArrayList();

		foreach($items as $item) {
			$extra = array(
				'Selected' => $this->value == $item->getValue(),
			);

			$item = $item->customise($extra);
			$fields->push($item);
		}

		return $fields;
	}

}