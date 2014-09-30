(function($) {
	"use strict";
	
	$.entwine.warningLevel = $.entwine.WARN_LEVEL_BESTPRACTISE;
	$.entwine('ss.deploynaut', function($) {
		
		$('.tickall select').entwine({
			IDs: [],
			targets: function() {
				return [];
			},
			onchange: function() {
				var 
					oldVal = this.getIDs() || [],
					newVal = this.val() || [],
					targets = this.targets();
				// Update each list
				$.each(targets, function(targetIndex, target) {
					var targetFiltered = target.val() || [];
					// Deselect removed items
					targetFiltered = $.grep(targetFiltered, function(targetItem) {
						var keep = !($.inArray(targetItem, oldVal) > -1) // Wasn't in old list, could not have been removed
							|| ($.inArray(targetItem, newVal) > -1); // Either added or already selected
						return keep;
					});
					
					// Select newly added items
					$.each(newVal, function(newItemIndex, newItem) {
						if(!($.inArray(newItem, targetFiltered) > -1) && !($.inArray(newItem, oldVal) > -1)) {
							targetFiltered.push(newItem);
						}
					});
					// Update item
					target
						.val(targetFiltered)
						.trigger('liszt:updated')
						.trigger('change')
						.chosen();
				});
				// Update list
				this.setIDs(newVal);
			}
		});
		
		$('.tickall select#Form_ItemEditForm_TickAllSnapshotGroups').entwine({
			targets: function() {
				return [
					$('#Form_ItemEditForm_CanRestoreGroups'),
					$('#Form_ItemEditForm_CanBackupGroups'),
					$('#Form_ItemEditForm_ArchiveDeleterGroups'),
					$('#Form_ItemEditForm_ArchiveUploaderGroups'),
					$('#Form_ItemEditForm_ArchiveDownloaderGroups')
				];
			}
		});
		
		$('.tickall select#Form_ItemEditForm_TickAllSnapshot').entwine({
			targets: function() {
				return [
					$('#Form_ItemEditForm_CanRestoreMembers'),
					$('#Form_ItemEditForm_CanBackupMembers'),
					$('#Form_ItemEditForm_ArchiveDeleters'),
					$('#Form_ItemEditForm_ArchiveUploaders'),
					$('#Form_ItemEditForm_ArchiveDownloaders')
				];
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
