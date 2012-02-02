ssh_options[:port] = 22

server 'localhost', :web
set :deploy_to, "/sites/#{application}"