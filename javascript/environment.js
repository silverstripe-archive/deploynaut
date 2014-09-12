(function($) {
	"use strict";
	
	$.entwine.warningLevel = $.entwine.WARN_LEVEL_BESTPRACTISE;
	$.entwine('ss.deploynaut', function($) {
		
		$('#Form_ItemEditForm_TickAllSnapshot input').entwine({
			onclick: function(evt) {
				var id = $(evt.target).attr('value');
				var checked = evt.target.checked;
				$('#Form_ItemEditForm_CanRestoreMembers_' + id)[0].checked = checked;
				$('#Form_ItemEditForm_CanBackupMembers_' + id)[0].checked = checked;
				$('#Form_ItemEditForm_ArchiveDeleters_' + id)[0].checked = checked;
				$('#Form_ItemEditForm_ArchiveUploaders_' + id)[0].checked = checked;
				$('#Form_ItemEditForm_ArchiveDownloaders_' + id)[0].checked = checked;
				$('#Form_ItemEditForm_PipelineApprovers_' + id)[0].checked = checked;
				$('#Form_ItemEditForm_PipelineCancellers_' + id)[0].checked = checked;
			}
		});

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
						self._setupPinging(modal, data.href);
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
