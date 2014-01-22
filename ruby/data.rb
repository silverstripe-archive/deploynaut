namespace :data do
	task :getdb do
		puts mysql_options
		# todo
	end

	task :getassets do
		# todo
	end

	# return a string with mysql options, e.g. "-u user -p12345 -h hostname SS_mysite"
	def mysql_options
		database_username = ""
		database_password = ""
		database_name = ""
		database_host = ""

		# todo: "do |_, _, database_username" doesn't work here, is that possible?
		run %Q{ php -r "require_once '#{current_path}/../../_ss_environment.php'; echo SS_DATABASE_USERNAME;" } do |channel, stream, data|
			database_username = data
		end

		run %Q{ php -r "require_once '#{current_path}/../../_ss_environment.php'; echo SS_DATABASE_PASSWORD;" } do |channel, stream, data|
			database_password = data
		end

		# todo: if SS_DATABASE_NAME isn't defined, how do we get the database name?
		run %Q{ php -r "require_once '#{current_path}/../../_ss_environment.php'; echo SS_DATABASE_NAME;" } do |channel, stream, data|
			database_name = data
		end

		# return the target machine hostname, strip newlines
		run "echo `hostname`" do |channel, stream, data|
			database_host = data.strip
		end

		"-u #{database_username} -p#{database_password} -h #{database_host} #{database_name}"
	end
end
