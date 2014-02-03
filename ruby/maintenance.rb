namespace :maintenance do
	desc <<-DESC
		Enables a maintenance page on the deploy target and disables normal traffic to the site.
		Copies a template .htaccess and html page into the current release directory.

		TODO: Hardcoded deploynaut path /sites/deploynaut/www
		TODO: Use existing assets/error-503.html in website if available
		TODO: Only supports Apache. Doesn't work with nginx... yet.
	DESC
	task :enable do
		on_rollback { run "mv #{current_path}/.htaccess_original #{current_path}/.htaccess; true" }

		run "mv #{current_path}/.htaccess #{current_path}/.htaccess_original; true"

		upload("/sites/deploynaut/www/deploynaut/maintenance.html.template", current_path + "/maintenance.html")
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

