# Deploy the code by copying it up to the server so the target servers don't need
# to have access to the git repo
set :deploy_via, :copy
set :copy_strategy, :export
set :copy_cache, false

_cset(:sake_path) { "./framework/sake" }

# The migrate task takes care of doing the dev/build
namespace :deploy do

	task :pre_checks do
		# Abort the deployment if we discover the current site is not using symlinks where it should.
		if exists?(:shared_children)
			begin
				shared_children.each { |child| run "[ -h '#{current_path}/#{child}' ] || ! [ -e '#{current_path}/#{child}' ]" }
			rescue Exception => e
				logger.debug "Aborting: one of the shared_children exists and is not a symlink!"
				raise e
			end
		end
	end

	task :migrate do
		# Run custom pre-migration script.
		if exists?(:pre_migrate_script)
			run "if [ -f \"#{pre_migrate_script}\" ]; then #{pre_migrate_script} && echo \"Pre-migrate script returned $?\"; fi"
		end

		# Note: similar code is used in data.rb for post-push rebuild.
		# We allow users to not use sake at all if they set the path to false
		if (sake_path != false)
			bash = if exists?(:webserver_user) then "sudo -u #{webserver_user} bash" else "bash" end
			sake = "#{bash} #{latest_release}/#{sake_path}";
			
			# Prepare temporary cache
			unless exists?(:webserver_user) then run "mkdir -p #{latest_release}/silverstripe-cache" end
			
			# Flush and build database
			run "#{sake} dev flush=1" # Flush all servers
			run "#{sake} dev/build", :once => true # Limit DB operations to a single node

			# Check whether we need to run Solr_Configure
			if exists?(:solr_configure)
				run "#{sake} dev/tasks/Solr_Configure", :once => true
			end
			
			# Cleanup temporary cache
			unless exists?(:webserver_user) then run "rm -rf #{latest_release}/silverstripe-cache" end
			
			# Initialise the cache, in case dev/build wasn't executed on all hosts
			run "#{sake} dev"
		end

		# Run custom post-migration script.
		if exists?(:post_migrate_script)
			run "if [ -f \"#{post_migrate_script}\" ]; then #{post_migrate_script} && echo \"Post-migrate script returned $?\"; fi"
		end
	end

	# Overriden so we are using our code_deploy strategy with tar.gz uploading
	task :update_code, :except => { :no_release => true } do
		on_rollback { run "rm -rf #{release_path}; true" }

		if exists?(:build_filename)
			deploy_code_from_file!
		else
			strategy.deploy!
		end

		finalize_update
	end

	# distribute the tar.gz and unpack it on the target servers
	task :deploy_code_from_file! do
		# Determine the build name by removing the file extension from the file
		build_name = /([^\/]+).tar.gz$/.match("#{build_filename}")[1]
		set :deploy_timestamped, false
		set :release_name, build_name

		# Dont upload and unpack the release if it's been deployed previously
		unless releases.include?(build_name)
			# Sftp the file up
			top.upload build_filename, "#{release_path}.tar.gz"
			run "tar -C #{releases_path} -xzf #{release_path}.tar.gz"
			run "rm #{release_path}.tar.gz"
		end
	end

	task :restart do
		system "echo \""+Time.now.strftime("%Y-%m-%d %H:%M:%S")+" => #{branch} \" >> #{history_path}/#{config_name}.deploy-history.txt"
		logger.debug "Deploy finished."
	end

	task :create_clone_dir do
		system "mkdir /tmp/#{release_name}"
	end
end

before "deploy", "deploy:pre_checks"

before "deploy:update_code", "deploy:create_clone_dir"

after "deploy:finalize_update", "deploy:migrate"
