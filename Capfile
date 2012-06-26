load 'deploy'

# ---- load tasks from ./config dir ---- 
Dir['config/*.rb'].each { |task| load(task) }

# ---- Load multistage extension ---- 
set :stages, %w(idp_dojo testing dojo staging production)
#set :default_stage, "testing"
require 'capistrano/ext/multistage'

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
ssh_options[:username] = 'dojo'
ssh_options[:keys] = '/sites/deploynaut/www-keys/id_rsa'

# ---- Build directory ---- 
set :build_archive, "../builds"
