namespace :info do

	desc "Show the uptime for servers with linux load"
	task :uptime do
		run 'uptime'
	end
	
	desc "Show free diskspace on servers"
	task :diskspace do
		run 'df -hl -x tmpfs | awk \'{ print $4" "$6 }\''
	end
	
end