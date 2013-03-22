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
set :copy_cache, true

_cset(:sake_path) { "./framework/sake" }

# The migrate task takes care of doing the dev/build
namespace :deploy do

	task :migrate, :roles => :db do
		if exists?(:webserver_user)
			run "sudo su #{webserver_user} -c '#{latest_release}/#{sake_path} dev/build'"
		else
			run "mkdir -p #{latest_release}/silverstripe-cache"
			run "#{latest_release}/#{sake_path} dev/build flush=1"
			run "rm -rf #{latest_release}/silverstripe-cache"
		end
	end

	task :restart do
		system "echo \""+Time.now.strftime("%Y-%m-%d %H:%M:%S")+" => #{release_name} \" >> #{history_path}/#{config_name}.deploy-history.txt";
		logger.debug "Deploy finished."
	end
end

# Change the deploy target folder to the current branch name if the :branch
# is set, otherwise use default timestamp
before "deploy:update" do
	# check if the branch is set to head and .. do something?
	set :release_name,  "#{branch}" if exists?(:branch)
end



after "deploy:finalize_update", "deploy:migrate"