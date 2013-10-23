(function($) {
	"use strict";
	
	$.entwine.warningLevel = $.entwine.WARN_LEVEL_BESTPRACTISE;
	$.entwine('ss.deploynaut', function($) {
		
		var updateLog = null;
		
		$('#Form_ItemEditForm_action_check').entwine({
			
			onclick: function(e) {
				var url = this.attr('data-url'),
					dialog = $('<div class="ss-ui-dialog" id="ss-ui-dialog-' + Math.random(0, 100000000) + '" />'),
					self = this;
				e.preventDefault();
				// Start a ping job and get the log url
				$.ajax({
					type: "POST",
					url: url,
					success: function(data) {
						var modal = dialog.ssdialog({
							autoOpen: true,
							width: 290,
							height: 500
						});
						
						// Setup the refresh of the log
						self._setupPinging(modal, data.logurl);
					},
					dataType: 'json'
				  });
			},
			
			/**
			 * Will fetch latest ping log and reload the content with it
			 */
			_setupPinging: function(modal, url) {
				var self = this;
				updateLog = window.setInterval(function() {
					$.ajax({
						type: "GET",
						url: url,
						dataType: 'json',
						success: function(data) {
							modal.html("<code><pre>"+data.message+"</pre></code>");
							// Stop the refreshing of the log
							if(data.status === "Complete") {
								self._clearInterval();
							}
						}
					});
				}, 500);
			},
			
			/**
			 * Will remove the pinging and refresh of the application list
			 */
			_clearInterval: function() {
				window.clearInterval(updateLog);
			}
		});
		
	});
})(jQuery);