namespace :data do

	desc <<-DESC
		Get a database off the target server, given the contents of the _ss_environment.php file.
		Output the file contents to a path on the deploynaut server
		Assumption: This task will run against the webserver, so that it's able to fetch the database credentials
		from _ss_environment.php

		Example command: cap -f '/sites/deploynaut/www/assets/Capfile' project1:env1 data:getdb -s data_path=/tmp/mydatabase.sql

		Required arguments to the cap command:
		data_path - Absolute path (including filename) of where the exported database should be placed, e.g. /tmp/my_database.sql
	DESC
	task :getdb do
		# todo: output to gzip and stream that back instead of the raw data.
		run "mysqldump --skip-opt --add-drop-table --extended-insert --create-options --quick --set-charset --default-character-set=utf8 #{mysql_options} -p", :once => true do |channel, stream, data|
			if data =~ /^Enter password: /
				channel.send_data "#{getmysqlpassword}\n"
			else
				begin
					file = File.open(data_path, "a")
					file.write(data)
				rescue IOError => e
					logger.debug e.message
					raise e
				ensure
					file.close unless file == nil
				end
			end
		end
	end

	desc <<-DESC
		Upload a database to the target server, and overwrite the existing database that exists.
		Works with a normal .sql file, as well as a compress .sql.gz file.

		Example command: cap -f '/sites/deploynaut/www/assets/Capfile' project1:env1 data:pushdb -s data_path=/tmp/mydatabase.sql

		Required arguments to the cap command:
		data_path - Absolute path to the database on deploynaut server to be imported
	DESC
	task :pushdb do
		begin
			dump_command = ""
			database_name = getdatabasename
			database_file = File.basename(data_path)
			database_ext = File.extname(data_path)
			mysql_options_string = mysql_options
			tmpfile = "/tmp/dbupload-" + Time.now.to_i.to_s + database_file

			upload data_path, tmpfile, :via => :scp, :once => true

			# Drop and recreate database in case the SQL doesn't have the drop table statements.
			# Note: We don't set the collation nor charset on the database level to remain consistent with SilverStripe practice to use MySQL defaults.
			# The sql dump content will determine default charset and collation for tables, and SS will override charsets per column anyway.
			recreate_command = "echo 'DROP DATABASE IF EXISTS `#{database_name}`; CREATE DATABASE `#{database_name}`;' | mysql --default-character-set=utf8 #{mysql_options_string} -p"
			run recreate_command, :once => true do |channel, stream, data|
				if data =~ /^Enter password: /
					channel.send_data "#{getmysqlpassword}\n"
				end
			end

			if database_ext == ".gz"
				dump_command = "gunzip -c #{tmpfile} | mysql --default-character-set=utf8 #{mysql_options_string} -p"
			else
				dump_command = "mysql --default-character-set=utf8 #{mysql_options_string} -p < #{tmpfile}"
			end

			run dump_command, :once => true do |channel, stream, data|
				if data =~ /^Enter password: /
					channel.send_data "#{getmysqlpassword}\n"
				end
			end

			run "rm -rf #{tmpfile}", :once => true
		rescue Exception => e
			run "rm -rf #{tmpfile}", :once => true
			raise e
		end
	end

	desc <<-DESC
		Download assets directory off target server and place them into a path on the deploynaut server.

		Example command: cap -f '/sites/deploynaut/www/assets/Capfile' project1:env1 data:getassets -s data_path=/tmp

		Required arguments to the cap command:
		data_path - Absolute path to where the assets should be placed, this will create an assets directory relative to that
		e.g. setting this to /tmp/mysite will place assets at /tmp/mysite/assets
	DESC
	task :getassets do
		normalise_assets(:once => true)

		server = find_servers_for_task(current_task)[0]
		puts "Getting assets from #{server.host}..."
		rsync_transfer server, server.host << ":#{shared_path}/assets", data_path
	end

	desc <<-DESC
		Upload assets directory to the target server, into the target's shared path directory replacing the existing assets.

		Example command: cap -f '/sites/deploynaut/www/assets/Capfile' project1:evn1 data:putdb -s data_path=/sites/mysite/www/assets

		Required arguments to the cap command:
		data_path - Absolute path to where the assets that should be uploaded reside
	DESC
	task :pushassets do
		begin
			normalise_assets

			# Files under assets should be by definition deletable by www-data (either owned, or through g+w)...
			pre = if exists?(:webserver_user) then "sudo -u #{webserver_user}" else "" end
			run "#{pre} find #{shared_path}/assets -mindepth 1 -delete"
			# ... but the webserver user may not have the write permission to the ".." directory.
			run "rmdir #{shared_path}/assets"

			threads = []
			find_servers_for_task(current_task).each do |server|
				threads << Thread.new do
					puts "Pushing assets to #{server.host}..."
					rsync_transfer server, data_path, server.host << ":#{shared_path}"
				end
			end

			# Wait for all threads to finish before moving on
			threads.each { |thread| thread.join }
		ensure
			# Now that we have uploaded new files we need to make sure they are readable by the webserver_user.
			normalise_assets
		end
	end

	# Transfer files via rsync from source to target by means of an SSH connection.
	def rsync_transfer(server, source, target)
		ssh_command = %w[]
		if server.options[:ssh_options]
			username = server.options[:ssh_options][:username]
		else
			username = fetch(:ssh_options)[:username]
		end

		if exists?(:gateway)
			puts "Using gateway to SSH into target instance"
			# gateway is configured like this: "set :gateway, 'deploy@mygatewayserver.com:222'"
			# so we need to split the 222 off the end if set, and pass that as the -p argument so
			# SSH will accept it.
			server = fetch(:gateway).split(':')
			ssh_command << "/usr/bin/ssh"
			ssh_command << server[0]
			if server[1]
				ssh_command << "-p" << server[1]
			end
			ssh_command << "-l" << username
			ssh_command << "-i" << fetch(:ssh_options)[:keys]
			ssh_command << "-A"
		end

		ssh_command << "/usr/bin/ssh"
		ssh_command << fetch(:rsync_ssh_options)

		if fetch(:ssh_options).key?(:port)
			ssh_command << "-p" << fetch(:ssh_options)[:port].to_s
		end

		ssh_command << "-l" << username
		ssh_command << "-i" << fetch(:ssh_options)[:keys]
		if fetch(:ssh_options)[:forward_agent] === true
			ssh_command << "-A"
		end
		rsync_command = %w[/usr/bin/rsync]
		rsync_command << fetch(:rsync_options)
		rsync_command << "-e" << "'#{ssh_command.join(' ')}'"
		rsync_command << source
		rsync_command << target

		command_str = rsync_command.join(' ')
		puts "Running rsync command: " << command_str

		system command_str or raise "rsync transfer failed"
	end

	# Apply permissions that will allow us to push and pull assets. This can only fix permissions on files owned
	# by either the ssh user or the webserver user - if any other files are present, and they are unreadable, this
	# will result in failed transfers.
	#
	# If webserver_user is not set, then we assume the webserver user is the same as the ssh user.
	#
	# Our desired state after the normalisation has the following qualities:
	# - asset directory must exist.
	# - all files within assets must be readable, writable and deletable by the webserver user.
	# - all files within assets must be readable by the ssh user.
	# - root directory must be deletable by the ssh user.
	#
	# To accomplish our goals, the system must be set up such that:
	# - webserver user is in the default group used by the ssh user.
	# - root asset directory is writable by the ssh user (so that it can be deleted)
	# - parent directory for the asset root is writable by the ssh user (so that the asset dir can be deleted)
	# - no files in assets are owned by users other than ssh or webserver user.
	#
	# TODO this can be speeded up by adding specific conditions to find (so it doesn't modify files unnecessarily).
	#
	def normalise_assets(params = {})
		if exists?(:webserver_user)
			# Make sure asset directory exists.
			run "if [ ! -e #{shared_path}/assets ]; then mkdir #{shared_path}/assets; fi", params
			# Webserver-owned files, just fix permissions.
			run "sudo -u #{webserver_user} find #{shared_path} -maxdepth 1 -type d -user #{webserver_user} -exec chmod 0775 {} \\;", params
			run "sudo -u #{webserver_user} find #{shared_path}/assets -maxdepth 1 -type d -user #{webserver_user} -exec chmod 0775 {} \\;", params
			run "sudo -u #{webserver_user} find #{shared_path}/assets -mindepth 1 -type d -user #{webserver_user} -exec chmod 2755 {} \\;", params
			run "sudo -u #{webserver_user} find #{shared_path}/assets -type f -user #{webserver_user} -exec chmod 0644 {} +", params
			# Ssh-user owned files, must be writable by the webserver user.
			# We cannot give files to webserver_user without being root, so we set the group write permission instead.
			run "find #{shared_path}/assets -maxdepth 1 -type d -user `whoami` -exec chmod 0775 {} \\;", params
			run "find #{shared_path}/assets -mindepth 1 -type d -user `whoami` -exec chmod 2775 {} \\;", params
			run "find #{shared_path}/assets -type f -user `whoami` -exec chmod 0664 {} +", params
		else
			run "if [ ! -e #{shared_path}/assets ]; then mkdir #{shared_path}/assets; fi", params
			run "find #{shared_path}/assets -type d -exec chmod 2755 {} \\;", params
			run "find #{shared_path}/assets -type f -exec chmod 0644 {} +", params
		end
	end

	def getdatabasename
		return run_php_as_silverstripe_code("echo $databaseConfig['database'];")
	end

	def getmysqlpassword
		return run_php_as_silverstripe_code("echo $databaseConfig['password'];")
	end

	# return a string with mysql options, e.g. "-u user -h hostname SS_mysite"
	# but without the password, for security reasons.
	def mysql_options
		database_server = ""
		database_username = ""

		database_server = run_php_as_silverstripe_code("echo $databaseConfig['server'];")
		database_username = run_php_as_silverstripe_code("echo $databaseConfig['username'];")

		"-u #{database_username} -h #{database_server} #{getdatabasename}"
	end

	# Runs PHP code once silverstripe is spinning, then return the output
	def run_php_as_silverstripe_code(phpcode)
		if "true" == capture("if [ -e '#{current_path}/framework/core/Core.php' ]; then echo 'true'; fi").strip
			# It's a SilverStripe 3 install, and it works!
			core_file = "#{current_path}/framework/core/Core.php"
		elsif "true" == capture("if [ -e '#{current_path}/sapphire/core/Core.php' ]; then echo 'true'; fi").strip
			# It's a SilverStripe 2 install, and it works!
			core_file = "#{current_path}/sapphire/core/Core.php"
		else
			raise "No SilverStripe installation detected"
		end

		code = "<?php
		define('BASE_PATH', '#{current_path}');
		define('BASE_URL', '/');
		$_SERVER['HTTP_HOST'] = 'localhost';
		chdir(BASE_PATH);
		$_GET['flush'] = 1;
		require_once '#{core_file}';
		#{phpcode} ; "

		filename = "/tmp/deploynaut-sniffer-" + rand(36**8).to_s(36) + ".php"

		put code, filename, :once => true

		output = ''
		run "php #{filename}", :once => true do |channel, stream, data|
			output = data
		end

		run "rm -rf #{filename}", :once => true

		output
	end
end

