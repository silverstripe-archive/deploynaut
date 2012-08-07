(function($) {
		
		$.post('naut/deploy', {
			'EnvironmentName': $('.environmentname').html(),
			'BuildFullName': $('.buildfullname').html(),
			'BuildFileName': $('.buildfilename').html()
		}, function(data) {
			$('#deploy_action').html(data);
			$("#deploy_log").load('naut/getlog');
		});
		
		var refreshId = setInterval(function() {
			$("#deploy_log").load('naut/getlog?randval='+ Math.random());
			
			//if ($('#box').scrollTop() == $('#box').outerHeight()) {
				// We're at the bottom.
			//	$('#deploy_log').animate({scrollTop: $('#deploy_log')[0].scrollHeight});
			// }
		}, 1000);

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
			
		});

}(jQuery));