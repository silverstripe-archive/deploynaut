namespace :maintenance do
	desc <<-DESC
		Enables a maintenance page on the deploy target and disables normal traffic to the site.
		Copies a template .htaccess and html page into the current release directory.

		TODO: Hardcoded deploynaut path /sites/deploynaut/www
		TODO: Only supports Apache. Doesn't work with nginx... yet.
	DESC
	task :enable do
		on_rollback { run "mv #{current_path}/.htaccess_original #{current_path}/.htaccess; true" }

		run "mv #{current_path}/.htaccess #{current_path}/.htaccess_original; true"

		# if there's an error-503.html file available in assets, use that for the maintenance page
		custom_maintenance = nil
		custom_maintenance_path = "#{shared_path}/assets/error-503.html"
		run "[ -f \"#{custom_maintenance_path}\" ]; then cp #{custom_maintenance_path} #{current_path}/maintenance.html && echo 1; else echo 0; fi" do |_, _, data|
			if data[0] == "1"
				custom_maintenance = true
			end
		end

		# if there's no custom maintenance page found above, use a default one supplied with deploynaut
		if custom_maintenance == nil
			upload("/sites/deploynaut/www/deploynaut/maintenance.html.template", current_path + "/maintenance.html")
		end

		upload("/sites/deploynaut/www/deploynaut/maintenance.htaccess.template", current_path + "/.htaccess")
	end

	desc <<-DESC
		Disables an existing maintenance page on the deploy target.
	DESC
	task :disable do
		run "mv #{current_path}/.htaccess_original #{current_path}/.htaccess; true"
		run "rm #{current_path}/maintenance.html; true"
	end
end

