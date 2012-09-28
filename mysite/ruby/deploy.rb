# Before the switching the current symlink, do the silverstripe specifics
after "deploy:finalize_update", "deploy:silverstripe"
# Automatically remove old releases
#after "deploy:update", "deploy:cleanup"

# Override the default capistrano deploy recipe that is build for rails apps
namespace :deploy do

	# Overriden so we are using our code_deploy strategy with tar.gz uploading
	task :update_code, :except => { :no_release => true } do
		on_rollback { 
			# @todo move into deploy::rollback if applicable
			if latest_release
				if ('true' ==  capture("if [ -e #{latest_release}/assets ]; then echo 'true'; fi").strip)
					# Set permissions for files
					run "find #{latest_release}/assets -not -perm 775 -type d -exec chmod 775 {} \\;"
					# Set permissions for files
					run "find #{latest_release}/assets -not -perm 664 -type f -exec chmod 664 {} \\;"
				end
				run "rm -rf #{release_path}; true"
			end
		}
		code_deploy!
		finalize_update
	end

	# distribute the tar.gz and unpack it on the target servers
	task :code_deploy! do
		# Dont upload and unpack the release if it's been deployed previously
		unless releases.include?(build_name) 
			# Grab the first part of the config - the project name (that maps to a config & build directory)
			project = config_name.split(':').first
			# Sftp the file up
			top.upload "#{build_archive}/#{project}/#{build_name}.tar.gz", "#{release_path}.tar.gz"
			run "tar -C #{releases_path} -xzf #{release_path}.tar.gz"
			run "rm #{release_path}.tar.gz"
		end 
	end
	
	# Find the build number from the commandline argument -s build=aa-b123
	def build_name 
		_build_name = "#{build}" if exists?(:build)
		raise 'You must pass a build by: "cap taskname -s build=aa-b234"' unless _build_name
		set :deploy_timestamped, false;
		set :release_name,  _build_name
		release_name
	end 

	# The migrate task takes care of Silverstripe specifics
	#	1) Create a silverstripe-cache in the release folder
	#	2) Set 775 permissions on all folder
	#	3) Set 664 permissions on all files
	#	4) Change the owner of everything to the 'webserver_group'
	task :silverstripe do
		# Disabled the uploading of the _ss_environment.php, but leaving it here as an example
		# top.upload "./config/_ss_environment.php", "#{latest_release}/_ss_environment.php", :via => :scp

		# Add the cache folder inside this release so we don't need to worry about the cache being weird.
		# ...Not needed - cache for each version will be put into separate dir anywa as we are symlinking!
		# run "mkdir -p #{latest_release}/silverstripe-cache"

		# Make sure that framework/sake is executable
		run "chmod a+x #{latest_release}/framework/sake"

		# Run the mighty dev/build, as a webserver user if requested.
		if webserver_user
			run "sudo -u #{webserver_user} #{latest_release}/framework/sake dev/build flush=1"
		else
			run "#{latest_release}/framework/sake dev/build flush=1"
		end

		# Set permissions for directories
		run "find #{latest_release} -not -group #{webserver_group} -not -perm 775 -type d -exec chmod 775 {} \\;"

		# Set permissions for files
		run "find #{latest_release} -not -group #{webserver_group} -not -perm 664 -type f -exec chmod 664 {} \\;"

		# Set the execute permissions on framework/sake again
		run "chmod a+x #{latest_release}/framework/sake"

		# Set the group owner to the webserver group
		run "chown -RP :#{webserver_group} #{latest_release}"
	end

	# Symlink all the 'shared_children into the newly relasesed folder
	# Overriden due to we don't want to touch javascript and css folders
	task :finalize_update, :except => { :no_release => true } do
		shared_children.map do |d|
			# Only recreate if symlink missing.
			if ('true' !=  capture("if [ -e #{latest_release}/#{d} ]; then echo 'true'; fi").strip)
				run "ln -sf #{shared_path}/#{d.split('/').last} #{latest_release}/#{d}"
			end
		end
    end

	# Overriden due to we don't want to restart any services on the server.
	task :restart do
		system "echo \""+Time.now.strftime("%Y-%m-%d %H:%M:%S")+" => #{build_name} \" >> assets/#{config_name}.deploy-history.txt";
		logger.debug "Deploy finished."
	end
end
