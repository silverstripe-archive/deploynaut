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
		
}(jQuery));