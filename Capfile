load 'deploy'

set :config_root, '../deploynaut-resources/envs'
require 'capistrano/multiconfig'

# ---- load tasks from ./config dir ---- 
Dir['mysite/ruby/*.rb'].each { |task| load(task) }

# ---- What directories are shared between releases ---- 
set :shared_children, %w(assets)

# ---- change the effective symlink to www ----
set :current_dir, 'www'

# ---- Keep at the most five releases ----
set :keep_releases, 5

# ---- Users and SSH ---- 
# Prevent asking for passwords
set :password, false
set :use_sudo, false

# ---- Build directory ---- 
set :build_archive, "../deploynaut-resources/builds"
set :scm, "git"
