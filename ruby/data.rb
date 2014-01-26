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
		database_name = getdatabasename

		# todo: output to gzip and stream that back instead of the raw data.
		run "mysqldump --skip-opt --add-drop-table --extended-insert --create-options --quick --set-charset --default-character-set=utf8 #{mysql_options} -p" do |channel, stream, data|
			if data =~ /^Enter password: /
				channel.send_data "#{getmysqlpassword}\n"
			else
				begin
					file = File.open(data_path, "a")
					file.write(data)
				rescue IOError => e
					# error writing the file.
				ensure
					file.close unless file == nil
				end
			end
		end
	end

	desc <<-DESC
		Upload a database to the target server, and overwrite the existing database that exists.
		Works with a normal .sql file, as well as a compress .sql.gz file.

		TODO: No backups yet. (needs to run getdb prior to this so we have a copy of the db that can be restored in case of an error)

		Example command: cap -f '/sites/deploynaut/www/assets/Capfile' project1:env1 data:putdb -s data_path=/tmp/mydatabase.sql

		Required arguments to the cap command:
		data_path - Absolute path to the database on deploynaut server to be imported
	DESC
	task :pushdb do
		dump_command = ""
		database_file = File.basename(data_path)
		tmpdir = "/tmp/dbupload-" + Time.now.to_i.to_s

		upload(data_path, tmpdir, :via => :scp)

		if File.extname(data_path) == ".gz"
			dump_command = "gunzip -c #{tmpdir}/#{database_file} | mysql --default-character-set=utf8 #{mysql_options} -p"
		else
			dump_command = "mysql --default-character-set=utf8 #{mysql_options} -p < #{tmpdir}/#{database_file}"
		end

		run dump_command do |channel, stream, data|
			if data =~ /^Enter password: /
				channel.send_data "#{getmysqlpassword}\n"
			end
		end

		run "rm -rf #{tmpdir}"
	end

	desc <<-DESC
		Download assets directory off target server and place them into a path on the deploynaut server.

		Example command: cap -f '/sites/deploynaut/www/assets/Capfile' project1:env1 data:getassets -s data_path=/tmp

		Required arguments to the cap command:
		data_path - Absolute path to where the assets should be placed, this will create an assets directory relative to that
		e.g. setting this to /tmp/mysite will place assets at /tmp/mysite/assets
	DESC
	task :getassets do
		download(shared_path + "/assets", data_path, :recursive => true, :via => :scp) do |channel, name, sent, total|
			# TODO Less noisy progress indication
			#puts name
		end
	end

	desc <<-DESC
		Upload assets directory to the target server, into the target's shared path directory replacing the existing assets.

		TODO: No backups yet. (needs to run getassets prior to this so we have a copy of the assets that can be restored in case of an error)

		Example command: cap -f '/sites/deploynaut/www/assets/Capfile' project1:evn1 data:putdb -s data_path=/sites/mysite/www/assets

		Required arguments to the cap command:
		data_path - Absolute path to where the assets that should be uploaded reside
	DESC
	task :pushassets do
		run "rm -rf #{shared_path}/assets"

		upload(data_path, shared_path, :recursive => true, :via => :scp) do |channel, name, sent, total|
			# TODO Less noisy progress indication
			#puts name
		end
	end

	def getdatabasename
		database_name = ""
		# todo: if SS_DATABASE_NAME isn't defined, how do we get the database name?
		run %Q{ php -r "require_once '#{current_path}/../../_ss_environment.php'; echo SS_DATABASE_NAME;" } do |channel, stream, data|
			database_name = data
		end

		database_name
	end

	def getmysqlpassword
		database_password = ""

		run %Q{ php -r "require_once '#{current_path}/../../_ss_environment.php'; echo SS_DATABASE_PASSWORD;" } do |channel, stream, data|
			database_password = data
		end

		database_password
	end

	# return a string with mysql options, e.g. "-u user -h hostname SS_mysite"
	# but without the password, for security reasons.
	def mysql_options
		database_server = ""
		database_username = ""
		database_host = ""

		# todo: "do |_, _, database_username" doesn't work here, is that possible?
		run %Q{ php -r "require_once '#{current_path}/../../_ss_environment.php'; echo SS_DATABASE_SERVER;" } do |channel, stream, data|
			database_server = data
		end

		run %Q{ php -r "require_once '#{current_path}/../../_ss_environment.php'; echo SS_DATABASE_USERNAME;" } do |channel, stream, data|
			database_username = data
		end

		"-u #{database_username} -h #{database_server} #{getdatabasename}"
	end
end
