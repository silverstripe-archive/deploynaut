namespace :log do
	
	desc "Show 20 last apache error log entries"
	task :error, :roles => :web do
		run "tail -n20 #{apache_log_dir}/apache.error.log"
	end

end