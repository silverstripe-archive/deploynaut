(function($) {
	
	var deploy = {
		showlog: function (selector, logLink) {
			$.get(logLink, { randval: Math.random()},
				function(data){
					$(selector).text(data);
				}
			);
		},
		
		start: function() {
			var __refresh = function(){
				deploy.showlog(
					"#deploy_log",
					$('#deploy_log').data('loglink')
				);
				setTimeout(__refresh, 2000);
			}

			setTimeout(__refresh, 2000);
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
		
		// Deployment screen
		if($('#deploy_log').length) {
			deploy.start();
		}

		$('.project-branch > h3').click(function() {
			var $project = $(this).parent();
			if($project.hasClass('open')) $project.removeClass('open');
			else $project.addClass('open');
		})

		$('a.update-repository').click(function(e){
			e.preventDefault();

			$(this).attr('disabled', 'disabled');
			$(this).html('Fetching');
			$(this).toggleClass('loading');
			$.get($(this).attr('href'), function(data){
				location.reload();
			});
			
		});
	});
}(jQuery));