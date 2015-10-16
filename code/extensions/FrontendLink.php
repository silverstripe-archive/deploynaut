<?php

class FrontendLink extends DataExtension {

	public function updateItemEditForm($form) {
		if ($this->owner->record->hasMethod('Link')) {
			$link = sprintf(
				'<a style="margin: 0.5em" target="deploynaut-frontend" href="%s">Preview &raquo;</a>',
				$this->owner->record->Link()
			);
			$actions = $form->Actions();
			$actions->push(LiteralField::create('FrontendLink', $link));
		}
	}

}

