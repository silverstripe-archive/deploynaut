## Application name and deployment path
set :application, "internal.dev"
set :deploy_to, "/sites/#{application}"

# This will be used to chown the deployed files, make sure that the deploy user is part of this group
set :webserver_group, "www-data"

## Servers

# gateway through stigs computer that has the VPN
# set :gateway, 'slindqvist@192.168.2.178'

ssh_options[:port] = 22
server '202.175.137.226', :web, :db
server '10.60.250.182', :web, :db


ssh_options[:username] = 'silvers'
ssh_options[:keys] = '/sites/deploynaut/www-keys/id_rsa'