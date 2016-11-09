<?php

/**
 * @deprecated  2.0.0 - moved to Dispatchers and frontend
 *
 * Validates a multi-source commit selector
 *
 * @package deploynaut
 * @subpackage control
 */
class DeployForm_CommitValidator extends DeployForm_ValidatorBase {

	public function php($data) {
		// Check release method
		if (empty($data['SelectRelease'])
			|| !in_array($data['SelectRelease'], ['Tag', 'Branch', 'Redeploy', 'SHA', 'FilteredCommits'])
		) {
			$method = empty($data['SelectRelease']) ? '(blank)' : $data['SelectRelease'];
			$this->validationError(
				'SelectRelease',
				"Bad release selection method: $method",
				"error"
			);
			return false;
		}

		// Check sha
		return $this->validateCommit(
			$this->form->getSelectedBuild($data),
			'SelectRelease'
		);
	}

}

/**
 * @deprecated  2.0.0 - moved to Dispatchers and frontend
 *
 * Form for generating deployments from a specified commit
 *
 * @package deploynaut
 * @subpackage control
 */
class DeployForm extends Form {

	/**
	 * @param DNRoot $controller
	 * @param string $name
	 * @param DNEnvironment $environment
	 * @param DNProject $project
	 */
	public function __construct($controller, $name, DNEnvironment $environment, DNProject $project) {
		$field = $this->buildCommitSelector($project);
		$validator = new DeployForm_CommitValidator();
		$actions = new FieldList(
			new FormAction('showDeploySummary', 'Plan deployment', 'Show deployment plan'),
			new FormAction('doDeploy', 'Do deploy', 'Do deploy')
		);

		parent::__construct($controller, $name, new FieldList($field), $actions, $validator);
	}

	/**
	 * Get the build selected from the given data
	 *
	 * @param array $data
	 * @return string SHA of selected build
	 */
	public function getSelectedBuild($data) {
		if (isset($data['SelectRelease']) && !empty($data[$data['SelectRelease']])) {
			// Filter out the tag/branch name if required
			$array = explode('-', $data[$data['SelectRelease']]);
			return reset($array);
		}
		if (isset($data['FilteredCommits']) && !empty($data['FilteredCommits'])) {
			return $data['FilteredCommits'];
		}
	}

	/**
	 * Construct fields to select any commit
	 *
	 * @param DNProject $project
	 * @return FormField
	 */
	protected function buildCommitSelector($project) {
		// Branches
		$branches = [];
		foreach ($project->DNBranchList() as $branch) {
			$sha = $branch->SHA();
			$name = $branch->Name();
			$branchValue = sprintf("%s (%s, %s old)",
				$name,
				substr($sha, 0, 8),
				$branch->LastUpdated()->TimeDiff()
			);
			$branches[$sha . '-' . $name] = $branchValue;
		}

		// Tags
		$tags = [];
		foreach ($project->DNTagList()->setLimit(null) as $tag) {
			$sha = $tag->SHA();
			$name = $tag->Name();
			$tagValue = sprintf("%s (%s, %s old)",
				$name,
				substr($sha, 0, 8),
				$branch->LastUpdated()->TimeDiff()
			);
			$tags[$sha . '-' . $name] = $tagValue;
		}
		$tags = array_reverse($tags);

		// Past deployments
		$redeploy = [];
		foreach ($project->DNEnvironmentList() as $dnEnvironment) {
			$envName = $dnEnvironment->Name;
			foreach ($dnEnvironment->DeployHistory()->filter('State', \DNDeployment::STATE_COMPLETED) as $deploy) {
				$sha = $deploy->SHA;
				if (!isset($redeploy[$envName])) {
					$redeploy[$envName] = [];
				}
				if (!isset($redeploy[$envName][$sha])) {
					$pastValue = sprintf("%s (deployed %s)",
						substr($sha, 0, 8),
						$deploy->obj('LastEdited')->Ago()
					);
					$redeploy[$envName][$sha] = $pastValue;
				}
			}
		}

		// Merge fields
		$releaseMethods = [];
		if (!empty($branches)) {
			$releaseMethods[] = new SelectionGroup_Item(
				'Branch',
				new DropdownField('Branch', 'Select a branch', $branches),
				'Deploy the latest version of a branch'
			);
		}
		if ($tags) {
			$releaseMethods[] = new SelectionGroup_Item(
				'Tag',
				new DropdownField('Tag', 'Select a tag', $tags),
				'Deploy a tagged release'
			);
		}
		if ($redeploy) {
			$releaseMethods[] = new SelectionGroup_Item(
				'Redeploy',
				new GroupedDropdownField('Redeploy', 'Redeploy', $redeploy),
				'Redeploy a release that was previously deployed (to any environment)'
			);
		}

		$releaseMethods[] = new SelectionGroup_Item(
			'SHA',
			new Textfield('SHA', 'Please specify the full SHA'),
			'Deploy a specific SHA'
		);

		$field = new TabbedSelectionGroup('SelectRelease', $releaseMethods);
		$field->setValue(reset($releaseMethods)->getValue());
		$field->addExtraClass('clearfix');
		return $field;
	}
}
