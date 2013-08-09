# Deploy the code by copying it up to the server so the target servers don't need
# to have access to the git repo
set :deploy_via, :copy
set :copy_strategy, :export
set :copy_cache, false

_cset(:sake_path) { "./framework/sake" }

# The migrate task takes care of doing the dev/build
namespace :deploy do

	task :migrate do
		# Run custom pre-migration script.
		if exists?(:pre_migrate_script)
			run "if [ -f \"#{pre_migrate_script}\" ]; then #{pre_migrate_script} && echo \"Pre-migrate script returned $?\"; fi"
		end

		if exists?(:webserver_user)
			run "sudo -u #{webserver_user} bash #{latest_release}/#{sake_path} dev/build flush=1", :roles => :db
		else
			run "mkdir -p #{latest_release}/silverstripe-cache", :roles => :db
			run "bash #{latest_release}/#{sake_path} dev/build flush=1", :roles => :db
			run "rm -rf #{latest_release}/silverstripe-cache", :roles => :db
		end

		# Initialise the cache, in case dev/build wasn't executed on all hosts
		if exists?(:webserver_user)
			run "sudo -u #{webserver_user} bash #{latest_release}/#{sake_path} dev"
		end

		# Run custom post-migration script.
		if exists?(:post_migrate_script)
			run "if [ -f \"#{post_migrate_script}\" ]; then #{post_migrate_script} && echo \"Post-migrate script returned $?\"; fi"
		end
	end

	task :restart do
		system "echo \""+Time.now.strftime("%Y-%m-%d %H:%M:%S")+" => #{branch} \" >> #{history_path}/#{config_name}.deploy-history.txt";
		logger.debug "Deploy finished."
	end
end

after "deploy:finalize_update", "deploy:migrate", "deploy:cleanup"
