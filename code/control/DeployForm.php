<?php

/**
 * Base class for a pipeline initiation validator
 *
 * @package deploynaut
 * @subpackage control
 */
abstract class DeployForm_ValidatorBase extends Validator {

	/**
	 * @param string $fieldName
	 * @param string $message
	 * @param string $messageType
	 */
	public function validationError($fieldName, $message, $messageType = '') {
		// Just make any error use the form message
		$this->form->sessionMessage($message, $messageType);
		parent::validationError($fieldName, $message, $messageType);
	}

	/**
	 * Validate a commit sha
	 *
	 * @param string $sha
	 * @param string $field
	 * @return boolean
	 */
	protected function validateCommit($sha, $field) {
		// Check selected commit
		if(empty($sha)) {
			$this->validationError(
				$field,
				"No valid release selected",
				"required"
			);
			return false;
		}

		// Check validity of commit
		if(!preg_match('/^[a-f0-9]{40}$/', $sha)) {
			$this->validationError(
				$field,
				"Invalid release SHA: " . Convert::raw2xml($sha),
				"error"
			);
			return false;
		}

		return true;
	}
}

/**
 * Validates a multi-source commit selector
 *
 * @package deploynaut
 * @subpackage control
 */
class DeployForm_CommitValidator extends DeployForm_ValidatorBase {

	public function php($data) {
		// Check release method
		if(empty($data['SelectRelease'])
			|| !in_array($data['SelectRelease'], array('Tag', 'Branch', 'Redeploy', 'SHA', 'FilteredCommits'))
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
			DeployForm::get_selected_build($data),
			'SelectRelease'
		);
	}

}

/**
 * Validates a pipeline commit selector
 *
 * @package deploynaut
 * @subpackage control
 */
class DeployForm_PipelineValidator extends DeployForm_ValidatorBase {

	public function php($data) {
		return $this->validateCommit(
			DeployForm::get_selected_build($data),
			'FilteredCommits'
		);
	}
}

/**
 * Form for generating deployments from a specified commit
 *
 * @package deploynaut
 * @subpackage control
 */
class DeployForm extends Form {

	/**
	 * Get the build selected from the given data
	 *
	 * @param array $data
	 * @return string SHA of selected build
	 */
	public static function get_selected_build($data) {
		if(isset($data['SelectRelease']) && !empty($data[$data['SelectRelease']])) {
			// Filter out the tag/branch name if required
			$array = explode('-', $data[$data['SelectRelease']]);
			return reset($array);
		}
		if(isset($data['FilteredCommits']) && !empty($data['FilteredCommits'])) {
			return $data['FilteredCommits'];
		}
	}

	/**
	 * @param DNRoot $controller
	 * @param string $name
	 * @param DNEnvironment $environment
	 * @param DNProject $project
	 */
	public function __construct($controller, $name, DNEnvironment $environment, DNProject $project) {
		if($environment->HasPipelineSupport()) {
			list($field, $validator, $actions) = $this->setupPipeline($environment, $project);
		} else {
			list($field, $validator, $actions) = $this->setupSimpleDeploy($environment, $project);
		}
		parent::__construct($controller, $name, new FieldList($field), $actions, $validator);
	}

	/**
	 * @param DNEnvironment $environment
	 * @param DNProject $project
	 *
	 * @return array
	 */
	protected function setupSimpleDeploy(DNEnvironment $environment, DNProject $project) {
		// without a pipeline simply allow any commit to be selected
		$field = $this->buildCommitSelector($project);
		$validator = new DeployForm_CommitValidator();
		$actions = new FieldList(
			FormAction::create('showDeploySummary', "Go to summary")->addExtraClass('btn btn-primary')
		);
		return array($field, $validator, $actions);
	}

	/**
	 * @param DNEnvironment $environment
	 * @param DNProject $project
	 *
	 * @return array
	 * @throws Exception
	 */
	protected function setupPipeline(DNEnvironment $environment, DNProject $project) {
		// Determine if commits are filtered
		$canBypass = Permission::check(DNRoot::DEPLOYNAUT_BYPASS_PIPELINE);
		$canDryrun = $environment->DryRunEnabled && Permission::check(DNRoot::DEPLOYNAUT_DRYRUN_PIPELINE);
		$commits = $environment->getDependentFilteredCommits();
		if(empty($commits)) {
			// There are no filtered commits, so show all commits
			$field = $this->buildCommitSelector($project);
			$validator = new DeployForm_CommitValidator();
		} elseif($canBypass) {
			// Build hybrid selector that allows users to follow pipeline or use any commit
			$field = $this->buildCommitSelector($project, $commits);
			$validator = new DeployForm_CommitValidator();
		} else {
			// Restrict user to only select pipeline filtered commits
			$field = $this->buildPipelineField($commits);
			$validator = new DeployForm_PipelineValidator();
		}

		// Generate actions allowed for this user
		$actions = new FieldList(
			FormAction::create('startPipeline', "Begin the release process on " . $environment->Name)
				->addExtraClass('btn btn-primary')
				->setAttribute('onclick', "return confirm('This will begin a release pipeline. Continue?');")
		);
		if($canDryrun) {
			$actions->push(
				FormAction::create('doDryRun', "Dry-run release process")
					->addExtraClass('btn btn-info')
					->setAttribute(
						'onclick',
						"return confirm('This will begin a release pipeline, but with the following exclusions:\\n" .
						" - No messages will be sent\\n" .
						" - No capistrano actions will be invoked\\n" .
						" - No deployments or snapshots will be created.');"
					)
			);
		}
		if($canBypass) {
			$actions->push(
				FormAction::create('showDeploySummary', "Direct deployment (bypass pipeline)")
					->addExtraClass('btn btn-warning')
					->setAttribute(
						'onclick',
						"return confirm('This will start a direct deployment, bypassing the pipeline " .
						"process in place.\\n\\nAre you sure this is necessary?');"
					)
			);
			return array($field, $validator, $actions);
		}
		return array($field, $validator, $actions);
	}

	/**
	 * Construct fields to select any commit
	 *
	 * @param DNProject $project
	 * @param DataList|null $pipelineCommits Optional list of pipeline-filtered commits to include
	 * @return FormField
	 */
	protected function buildCommitSelector($project, $pipelineCommits = null) {
		// Branches
		$branches = array();
		foreach($project->DNBranchList() as $branch) {
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
		$tags = array();
		foreach($project->DNTagList()->setLimit(null) as $tag) {
			$sha = $tag->SHA();
			$name = $tag->Name();
			$tagValue = sprintf("%s (%s, %s old)",
				$name,
				substr($sha, 0, 8),
				$branch->LastUpdated()->TimeDiff()
			);
			$tags[$sha . '-' . $tag] = $tagValue;
		}
		$tags = array_reverse($tags);

		// Past deployments
		$redeploy = array();
		foreach($project->DNEnvironmentList() as $dnEnvironment) {
			$envName = $dnEnvironment->Name;
			foreach($dnEnvironment->DeployHistory() as $deploy) {
				$sha = $deploy->SHA;
				if(!isset($redeploy[$envName])) {
					$redeploy[$envName] = array();
				}
				if(!isset($redeploy[$envName][$sha])) {
					$pastValue = sprintf("%s (deployed %s)",
						substr($sha, 0, 8),
						$deploy->obj('LastEdited')->Ago()
					);
					$redeploy[$envName][$sha] = $pastValue;
				}
			}
		}

		// Merge fields
		$releaseMethods = array();
		if($pipelineCommits) {
			$releaseMethods[] = new SelectionGroup_Item(
				'FilteredCommits',
				$this->buildPipelineField($pipelineCommits),
				'Deploy a commit prepared for this pipeline'
			);
		}
		if($branches) {
			$releaseMethods[] = new SelectionGroup_Item(
				'Branch',
				new DropdownField('Branch', 'Deploy to', $branches),
				'Deploy the latest version of a branch'
			);
		}
		if($tags) {
			$releaseMethods[] = new SelectionGroup_Item(
				'Tag',
				new DropdownField('Tag', 'Deploy to', $tags),
				'Deploy a tagged release'
			);
		}
		if($redeploy) {
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
		return $field;
	}

	/**
	 * Generate fields necessary to select from a filtered commit list
	 *
	 * @param DataList $commits List of commits
	 * @return FormField
	 */
	protected function buildPipelineField($commits) {
		// Get filtered commits
		$filteredCommits = array();
		foreach($commits as $commit) {
			$title = sprintf(
				"%s (%s, %s old)",
				$commit->Message,
				substr($commit->SHA, 0, 8),
				$commit->dbObject('Created')->TimeDiff()
			);
			$filteredCommits[$commit->SHA] = $title;
		}
		if($filteredCommits) {
			return new DropdownField('FilteredCommits', '', $filteredCommits);
		} else {
			return DropdownField::create('FilteredCommits)', '')
				->setEmptyString('No deployments available')
				->performDisabledTransformation();
		}
	}
}
