/*jslint white: true, browser: true, nomen: true, devel: true */
/*global jQuery: false */
(function($) {
	"use strict";

	var queue = {
		showlog: function(status, content, logLink) {
			var self = this;
			$.getJSON(logLink, {randval: Math.random()},
			function(data) {
				status.text(data.status);
				content.text(data.content);
				$(status).parent().addClass(data.status);
				$('title').text(data.status + " | Deploynaut");
				if (data.status == 'Complete' || data.status == 'Failed' || data.status == 'Invalid') {
					$(status).parent().removeClass('Running Queued progress-bar-striped active');
					self._clearInterval();
				} else if (data.status == 'Running') {
					$(status).parent().addClass('progress-bar-striped active')
					$(status).parent().removeClass('Queued');
				}
			}
			);
		},


		start: function() {
			this._setupPinging();
		},


		/**
		 * Will fetch latest deploy log and reload the content with it
		 */
		_setupPinging: function() {
			var self = this;
			window._queue_refresh = window.setInterval(function() {
				self.showlog($("#queue_action .status"), $("#queue_log"), $('#queue_log').data('loglink'));
			}, 3000);
		},


		/**
		 * Will remove the pinging and refresh of the application list
		 */
		_clearInterval: function() {
			window.clearInterval(window._queue_refresh);
		}
	};

	$(document).ready(function() {

		// Enable select2
		$('select:not(.disable-select2)').select2();

		// Menu expand collapse
	    	$('a.nav-submenu').click(function() {
	        	$(this).toggleClass( "open" );
	    	});

		if ($('#Form_DeployForm_BuildName').val() === '') {
			$('#Form_DeployForm_action_doDeploy').attr('disabled', true);
		}

		$('#Form_DeployForm_BuildName').change(function() {
			if ($('#Form_DeployForm_BuildName').val() === '') {
				$('#Form_DeployForm_action_doDeploy').attr('disabled', true);
				return;
			}
			$('#Form_DeployForm_action_doDeploy').attr('disabled', false);
		});

		$('#Form_DeployForm_action_doDeploy').click(function() {
			return confirm('Are you sure that you want to deploy?');
		});

		// Deployment screen
		if ($('#queue_log').length) {
			queue.start();
		}

		$('.project-branch > .branch-details').click(function() {
			var $project = $(this).parent();
			var $content = $project.find('.project-branch-content');

			if ($project.hasClass('open')) {
				$project.removeClass('open');
			} else {
				$project.addClass('open');
				// If the content hasn't been loaded yet, load it
				if($content.html().match(/^\s+$/)) {
					$content.html("Loading...");
					$.get($project.data('href'), function(data) {
						$content.html(data);
					});
				}
			}
		});


		// This is the deployment page dropdown menu.
		$('.deploy-dropdown').click(function(e) {

			if($(this).hasClass('success')) {
				$(this).toggleClass('open');
				$($(this).attr('aria-controls')).collapse('toggle');
				return;
			}

			// Don't perform when we're already loading or have already loaded
			if($(this).hasClass('loading') || $(this).hasClass('success')) {
				return;
			}

			// Add loading class so the user can see something happening
			$(this).addClass('loading');

			// Yay Javascript!
			var self = this;

			$.ajax({
				type: "POST",
				url: $(this).data('api-url'),
				dataType: 'json',
				success: function(data) {

					// Check every 2 seconds to see the if job has finished.
					window.fetchInterval = window.setInterval(function() {
						$.ajax({
							type: "GET",
							url: data.href,
							dataType: 'json',
							success: function(data) {

								if(data.status === 'Failed') {
									$(self).removeClass('loading').addClass('error');
									clearInterval(window.fetchInterval);
								} else if(data.status === 'Complete') {
									// Now we need to load the form with the new GIT data
									$.ajax({
										type: 'GET',
										url: $(self).attr('data-form-url'),
										dataType: 'json',
										success: function(formData) {
											$(self).next('.deploy-form-outer').html(formData.Content);

											$(self).removeClass('loading').addClass('success').toggleClass('open');
											$($(self).attr('aria-controls')).collapse();

											// Enable select2
											$('.deploy-form-outer .tab-pane.active select:not(.disable-select2)').select2();

											// Ensure the correct value is set for hidden field "SelectRelease"
											var releaseType = $('.deploy-form-outer .tabbedselectiongroup > li.active a').attr('data-value');
											$('.deploy-form-outer').find('input[name="SelectRelease"]').attr('value', releaseType);
										}
									});

									clearInterval(window.fetchInterval);
								}
							},
							error: function(data) {
								$(self).removeClass('loading').addClass('error');
								clearInterval(window.fetchInterval);
							}
						});
					}, 2000);
				}
			});
		});

		$('.deploy-form-outer').on('click', '.tabbedselectiongroup > li > a', function (e) {
			// Set the release type.
			var releaseType = $(this).attr('data-value');
			$(this).parents('form').find('input[name="SelectRelease"]').attr('value', releaseType);

			$(this).tab('show');

			// Ensure select2 is enabled
			// This needs to be done when the tab is visible otherwise the width can screw up
			var id = $(this).attr('href');
			$(id).find('select:not(.disable-select2)').select2();

			return false;
		});

		$('.deploy-form-outer').on('click', '.deploy-button', function(e) {
			var releaseType = $(this).parents('form').find('input[name="SelectRelease"]').attr('value');

			var environment = $(this).attr('data-environment-name');
			var revision = $(this).parents('form').find('*[name="' + releaseType + '"]').val();

			return confirm('You are about to begin the following deployment:\n\n'
				+ 'Environment: ' + environment + '\n'
				+ 'Revision: ' + revision + '\n\n'
				+ 'Continue?');
		});


		$('.tooltip-hint:not(.git-sha), .btn-tooltip').tooltip({
			placement: 'top',
			trigger: 'hover'
		});

		$('.tooltip-hint.git-sha').tooltip({
			placement: 'left',
			trigger: 'hover',
			template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner git-sha"></div></div>'
		});


		/**
		 * Extend a specific target
		 */
		$('.extended-trigger').click(function(e) {
			var $el = $($(this).data('extendedTarget')), $container = $($(this).data('extendedContainer'));

			if($el.is(':empty')) {
				$container.data('href', $(this).attr('href'));
				$el.load($(this).attr('href'), function() {
					$container.removeClass('loading');
				});
				$container.addClass('loading');
				$container.show();
			} else {
				$el.empty();
				$container.hide();

				// Re-enter the click handler if another button has been pressed, so the form re-opens.
				if ($(this).attr('href')!==$container.data('href')) {
					$container.data('href', null);
					$(this).trigger('click');
				} else {
					$container.data('href', null);
				}

			}
			
			e.preventDefault();
		});

		$('.table-data-archives').on('click', ':input[name=action_doDataTransfer]', function(e) {
			var form = $(this).closest('form'),
				envVal = form.find("select[name=EnvironmentID]").val(),
				envLabel = form.find("select[name=EnvironmentID] option[value=\"" + envVal + '"]').text(),
				msg = 'Are you sure you want to restore data onto environment ' + envLabel + '?';

			if(!confirm(msg)) e.preventDefault();
		});

		/**
		 * Add a delay after clicking on Approve/Reject type buttons on a Pipeline. This is because there is a brief
		 * gap between one PipelineStep ending and the next beginning, and it's preferable to not show the user a page
		 * with no current step.
		 *
		 * @todo: Replace this with AJAX calls to the (not yet existing) Pipeline API so we can update automatically.
		 */
		$('.deployprogress-step .btn').click(function(e) {
			$(this).siblings('.btn').prop('disabled', true);
			$(this).toggleClass('active').html('<img src="deploynaut/images/ajax-loader.gif">');
			var href = $(this).prop('href');
			$.get($(this).prop('href'), function() {
				setTimeout(function() {
					window.location.reload();
				}, 2000);
			});

			e.preventDefault();
		});

	});
}(jQuery));
