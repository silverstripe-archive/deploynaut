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
		# Make sure the assets are actually readable by the ssh user.
		# This includes creating assets directory, if missing.
		if exists?(:webserver_user)
			run "sudo -u #{webserver_user} bash -c \"if [ ! -e #{shared_path}/assets ]; then mkdir #{shared_path}/assets; fi \"", :once => true
			run "sudo -u #{webserver_user} find #{shared_path}/assets -mindepth 1 -user #{webserver_user} -exec chmod a+r {} +", :once => true
		else
			run "if [ ! -e #{shared_path}/assets ]; then mkdir #{shared_path}/assets; fi ", :once => true
			run "find #{shared_path}/assets -mindepth 1 -exec chmod a+r {} +", :once => true
		end

		download shared_path + "/assets", data_path, :recursive => true, :via => :scp, :once => true
	end

	desc <<-DESC
		Upload assets directory to the target server, into the target's shared path directory replacing the existing assets.

		Example command: cap -f '/sites/deploynaut/www/assets/Capfile' project1:evn1 data:putdb -s data_path=/sites/mysite/www/assets

		Required arguments to the cap command:
		data_path - Absolute path to where the assets that should be uploaded reside
	DESC
	task :pushassets do
		begin
			# Files under assets are writable by www-data (either owned, or through g+w)...
			pre = if exists?(:webserver_user) then "sudo -u #{webserver_user}" else "" end
			run "#{pre} find #{shared_path}/assets -mindepth 1 -delete"
			# ... but the directory is owned by the ssh user, with chmod 775
			run "rmdir #{shared_path}/assets"

			upload data_path, shared_path, :recursive => true, :via => :scp

		ensure
			# We cannot give the files to www-data without being root, so we set the group write permission instead.
			# Also makes the assets directory 775 again.
			if exists?(:webserver_user)
				run "find #{shared_path}/assets -not -user #{webserver_user} -exec chmod g+rw {} +"
			else
				run "find #{shared_path}/assets -exec chmod g+rw {} +"
			end
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

