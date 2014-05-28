namespace :maintenance do
	desc <<-DESC
		Enables a maintenance page on the deploy target and disables normal traffic to the site.
		Copies a template .htaccess and html page into the current release directory.

		TODO: Only supports Apache. Doesn't work with nginx... yet.
	DESC
	task :enable do
		on_rollback {
			run "if [ -f #{current_path}/.htaccess_original ]; then mv #{current_path}/.htaccess_original #{current_path}/.htaccess; fi"
			run "if [ -f #{current_path}/maintenance.html ]; then rm #{current_path}/maintenance.html; fi"
		}

		# Does the location contain a site?
		has_htaccess = nil
		run "if [ -f \"#{current_path}/.htaccess\" ]; then echo 1; else echo 0; fi" do |_, _, data|
			if data[0] == "1"
				has_htaccess = true
			end
		end

		if has_htaccess == nil
			# Don't try putting maintenance screen on non-standard instances (all SilverStripe sites will have the .htaccess file)
			logger.debug "Skipping maintenance on missing .htaccess file."
		else
			run "mv #{current_path}/.htaccess #{current_path}/.htaccess_original; true"

			# if there's an error-503.html file available in assets, use that for the maintenance page
			custom_maintenance = nil
			custom_maintenance_path = "#{shared_path}/assets/error-503.html"
			run "if [ -f \"#{custom_maintenance_path}\" ]; then cp #{custom_maintenance_path} #{current_path}/maintenance.html && echo 1; else echo 0; fi" do |_, _, data|
				if data[0] == "1"
					custom_maintenance = true
				end
			end

			# if there's no custom maintenance page found above, use a default one supplied with deploynaut
			if custom_maintenance == nil
				upload(File.expand_path("../maintenance.html.template", File.dirname(__FILE__)), current_path + "/maintenance.html")
			end

			upload(File.expand_path("../maintenance.htaccess.template", File.dirname(__FILE__)), current_path + "/.htaccess")
		end
	end

	desc <<-DESC
		Disables maintenance page on the deploy target. Safe to run even if maintenance page has never been enabled.
	DESC
	task :disable do
		# If deployment has been successful the new release is in place, and the maintenance screen is already gone.
		run "if [ -f #{current_path}/.htaccess_original ]; then mv #{current_path}/.htaccess_original #{current_path}/.htaccess; fi"
		run "if [ -f #{current_path}/maintenance.html ]; then rm #{current_path}/maintenance.html; fi"
	end
end

