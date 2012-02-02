# Before the switching the current symlink, do the silverstripe specifics
before "deploy:symlink", "deploy:silverstripe"
# Automatically remove old releases
#after "deploy:update", "deploy:cleanup"

# Override the default capistrano deploy recipe that is build for rails apps
namespace :deploy do

	# Overriden so we are using our code_deploy strategy with tar.gz uploading
	task :update_code, :except => { :no_release => true } do
		on_rollback { run "rm -rf #{release_path}; true" }
		code_deploy!
		finalize_update
	end

	# distribute the tar.gz and unpack it on the target servers
	task :code_deploy! do
		top.upload "#{build_archive}/#{build_name}.tar.gz", "#{release_path}.tar.gz"
		run "tar -C #{releases_path} -xzf #{release_path}.tar.gz"
		run "rm #{release_path}.tar.gz && mv #{releases_path}/#{build_name} #{release_path}"
	end
	
	# Find the build number from the commandline argument -s build=aa-b123
	def build_name 
		return "#{build}" if exists?(:build)
		# Throw an exception otherwise
		raise 'You must pass a build by: "cap taskname -s build=aa-b234"'
	end 

	# The migrate task takes care of Silverstripe specifics
	#	1) Create a silverstripe-cache in the release folder
	#	2) Set 2775 permissions on all folder
	#	3) Set 664 permissions on all files
	#	4) Change the owner of everything to the 'webserver_group'
	task :silverstripe do
		# Disabled the uploading of the _ss_environment.php, but leaving it here as an example
		# top.upload "./config/_ss_environment.php", "#{latest_release}/_ss_environment.php", :via => :scp

		# Add the cache folder inside this release so we don't need to worry about the cache being weird.
		run "mkdir #{latest_release}/silverstripe-cache"

		# Make sure that sapphire/sake is executable
		run "chmod a+x #{latest_release}/sapphire/sake"

		# Run the mighty dev/build
		run "#{latest_release}/sapphire/sake dev/build"

		# Set permissions for directories
		run "find #{latest_release} -not -perm 2775 -type d -exec chmod 2775 {} \\;"

		# Set permissions for files
		run "find #{latest_release} -not -perm 664 -type f -exec chmod 664 {} \\;"

		# Set the execute permissions on sapphire/sake again
		run "chmod a+x #{latest_release}/sapphire/sake"

		# Set the group owner to the webserver group
		run "chown -RP :#{webserver_group} #{latest_release}"
	end

	# Symlink all the 'shared_children into the newly relasesed folder
	# Overriden due to we don't want to touch javascript and css folders
	task :finalize_update, :except => { :no_release => true } do
		shared_children.map do |d|
			run "ln -s #{shared_path}/#{d.split('/').last} #{latest_release}/#{d}"
		end
    end

	# Overriden due to we don't want to restart any services on the server.
	task :restart do
		logger.debug "No services to deploy."
	end
end