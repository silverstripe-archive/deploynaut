(function($) {

	var msg_unable_to_create = 'Unable to create key. Does one already exist?';
	var msg_error = 'Invalid response. Unable to determine whether the key has been created.';

	$.entwine('ss', function() {
		$('#action_generate').entwine({

			onclick: function() {
				if($(this).hasClass('ui-state-disabled')) {
					return;
				}

				// Disable button so we're not generating multiple keys.
				this.disableButton();

				var self = this;
				$.ajax({
					type: 'POST',
					url: $(this).data('api-url'),
					dataType: 'json',
					success: function(data) {
						window.fetchInterval = window.setInterval(function() {
							$.ajax({
								type: 'GET',
								url: data.href,
								dataType: 'json',
								success: function(log_data) {
									switch(log_data.status) {
										case 'failed':
											alert(msg_unable_to_create);  // eslint-disable-line no-alert
											clearInterval(window.fetchInterval);
											self.updateKey();

											// re-enable the button
											self.enableButton();
											break;
										case 'complete':
											clearInterval(window.fetchInterval);
											self.updateKey();

											// We can hide the button after we create it.
											$(self).hide();
											break;
										case false:
											alert(msg_error); // eslint-disable-line no-alert
											clearInterval(window.fetchInterval);
											self.updateKey();

											// Re-enable the button
											self.enableButton();
											break;
										case 'Waiting':
										case 'Running':
										default:
											// Keep waiting
											return;
									}
								}
							});
						}, 2000);
					}
				});
			},

			updateKey: function() {
				var self = this;
				$.ajax({
					type: 'POST',
					url: $(this).data('key-url'),
					dataType: 'json',
					success: function(data) {
						$(self).prev().children('textarea').val(data.public_key);
					}
				});
			},

			disableButton: function() {
				$(this).addClass('ui-state-disabled');
			},

			enableButton: function() {
				$(this).removeClass('ui-state-disabled');
			},

		});
	});
})(jQuery);
