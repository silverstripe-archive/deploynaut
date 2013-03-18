<?php
/**
 * Schedules a job to clone or update a git repository from a ruby environment file
 *
 * @uses Resque
 */
class SyncGitEnvironments extends BuildTask {

	/**
	 * @var string $title 
	 */
	protected $title = "Sync local git copies";

	/**
	 * @var string $description 
	 */
	protected $description = 'Schedules resque jobs to clone and fetch capistrano envs local git clones';

	/**
	 *
	 * @todo update the DNEnvironment with the git path as well
	 * @param SS_HTTPRequest $request
	 */
	public function run($request) {
		$data = Injector::inst()->get('DNData');
		$envDir = $data->getEnvironmentDir();
		$projects = $data->DNProjectList();
		
		foreach($projects as $project) {
			foreach($project->DNEnvironmentList() as $environment) {
				$envPath = $envDir.'/'.$project->Name.'/'.$environment->Filename;
				$gitPath = $this->getRepoFromCapistranoEnvFile($envPath);
				if(!$gitPath) {
					continue;
				}
				$localGitPath = sys_get_temp_dir().$project->Name.'/'.$environment->Name;
				$token = Resque::enqueue('deploy', 'UpdateGitRepo', array(
					'repo' => $gitPath,
					'path' => $localGitPath
				));
				echo '[+] Update of "'.$gitPath.'" is queued as job '.$token;
			}
		}
	}

	/**
	 * Parses capistrano environment files for a 'set :repository' and returns
	 * the value of it.
	 *
	 * @param string $filePath
	 * @return string
	 */
	protected function getRepoFromCapistranoEnvFile($filePath) {
		$lines = file($filePath);
		foreach($lines as $line) {
			if(!stristr($line, 'set :repository')) {
				continue;
			}
			list($set, $gitRepo) = explode(',', $line);
			return str_replace('"', '', trim($gitRepo));
		}
	}
}