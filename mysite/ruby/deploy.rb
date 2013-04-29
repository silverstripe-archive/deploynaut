# Defines for the default deployment recipes whether we want to use sudo or not.
set :use_sudo, false

# This a space separated list of folders that will be shared between deploys
set :shared_children, %w(assets)

# The number of old releases to keep, defaults to 5, can be overridden with
# any positive integer.
set :keep_releases, 10

# Keep set to false, RubyOnRails behaviour, will brake in Silverstripe
set :normalize_asset_timestamps, false

# Deploy the code by copying it up to the server so the target servers don't need
# to have access to the git repo
set :deploy_via, :copy
set :copy_strategy, :export
set :copy_cache, false

_cset(:sake_path) { "./framework/sake" }

# The migrate task takes care of doing the dev/build
namespace :deploy do

	task :migrate do
		if exists?(:webserver_user)
			run "sudo su #{webserver_user} -c '#{latest_release}/#{_sake_path} dev/build flush=1'", :roles => :db
		else
			run "mkdir -p #{latest_release}/silverstripe-cache", :roles => :db
			run "#{latest_release}/#{_sake_path} dev/build flush=1", :roles => :db
			run "rm -rf #{latest_release}/silverstripe-cache", :roles => :db
		end

		# Initialise the cache, in case dev/build wasn't executed on all hosts
		if exists?(:webserver_user)
			run "sudo su #{webserver_user} -c '#{latest_release}/#{_sake_path} dev"
		end
	end

	task :restart do
		system "echo \""+Time.now.strftime("%Y-%m-%d %H:%M:%S")+" => #{branch} \" >> #{history_path}/#{config_name}.deploy-history.txt";
		logger.debug "Deploy finished."
	end
end

after "deploy:finalize_update", "deploy:migrate"
