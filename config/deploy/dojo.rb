## Application name and deployment path
set :application, "aa-dojo"
set :deploy_to, "/sites/#{application}"

# This will be used to chown the deployed files, make sure that the deploy user is part of this group
set :webserver_group, "sites"

## Servers
ssh_options[:port] = 2222
server 'oscar.wgtn.silverstripe.com', :web, :db