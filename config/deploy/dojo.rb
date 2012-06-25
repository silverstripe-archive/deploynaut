## Application name and deployment path
set :application, "aa.co.nz"
set :deploy_to, "/sites/#{application}"

# This will be used to chown the deployed files, make sure that the deploy user is part of this group
set :webserver_group, "sites"

## Servers
ssh_options[:port] = 22
server 'localhost', :web, :db

## SSH options 
set :user, 'vagrant'
set :password, 'vagrant'
ssh_options[:forward_agent] = true
