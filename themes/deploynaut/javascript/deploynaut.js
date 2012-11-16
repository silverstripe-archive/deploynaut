(function($) {
	
	logFile = $('#deploy_log').data('logfile');
	
	var deploy = {
		showlog: function (selector, logfile) {
			$.get('naut/getlog', {logfile: logFile, randval: Math.random()},
				function(data){
					$(selector).html(data);
				}
			);
		},
		
		start: function() {
			$.post('naut/deploy', {
				'EnvironmentName': $('.environmentname').html(),
				'BuildFullName': $('.buildfullname').html(),
				'BuildFileName': $('.buildfilename').html(),
				'LogFile': logFile
			}, function(data) {
				$('#deploy_action').html(data);
				// reload every second
				setInterval(function(){deploy.showlog("#deploy_log", logFile);}, 1000);
			}).error(function(xhr) {
				$('#deploy_log').html(xhr.responseText);
			});
		}
	}

	$(document).ready(function(){
		if($('#Form_DeployForm_BuildName').val() === '') {
			$('#Form_DeployForm_action_doDeploy').attr('disabled', true);
		}
		$('#Form_DeployForm_BuildName').change(function(){
			if($('#Form_DeployForm_BuildName').val() === '') {
				$('#Form_DeployForm_action_doDeploy').attr('disabled', true);
				return;
			}
			$('#Form_DeployForm_action_doDeploy').attr('disabled', false);
		})
		$('#Form_DeployForm_action_doDeploy').click(function() {
			return confirm('Are you sure that you want to deploy?');
		});
		
		
		if($('#deploy_log')) {
			deploy.start();
		}
	});
}(jQuery));