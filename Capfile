load 'deploy'

Dir['config/*.rb'].each { |task| load(task) }

set :stages, %w(localhost testing staging production)
set :default_stage, "localhost"
require 'capistrano/ext/multistage'

# This will be used for /sites/:application where all builds are released
set :application, "aa.co.nz"
set :shared_children, %w(assets)

ssh_options[:forward_agent] = true

# ---- Keep at the most five releases
set :keep_releases, 5

# ---------------- Users and SSH ----------------
# As which user will we ssh login and execute remote commands as
set :user, 'deploy'
# This will be used to chown the deployed files, make sure that the depl
set :webserver_group, "sites"

set :use_sudo, false

set :build_archive, "../builds"
set :webserver_group, "sites"