ssh_options[:port] = 2222

## Servers
server 'aa-test.test.silverstripe.com', :web, :db
set :deploy_to, "/sites/#{application}"