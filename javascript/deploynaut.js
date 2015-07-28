/*jslint white: true, browser: true, nomen: true, devel: true */
/*global jQuery: false */
(function($) {
	"use strict";

	var queue = {
		showlog: function($status, $content, logLink) {
			var self = this;
			$.getJSON(logLink, {randval: Math.random()},
			function(data) {
				$status.text(data.status);
				$content.text(data.content);
				$status.attr('class', data.status);
				$('title').text(data.status + " | Deploynaut");
				if (data.status === 'Complete') {
					self._clearInterval();
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
				self.showlog($("#queue_action"), $("#queue_log"), $('#queue_log').data('loglink'));
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

		$('.project-branch > h3').click(function() {
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

		$('a.update-repository').click(function(e) {
			e.preventDefault();

			$(this).attr('disabled', 'disabled');
			$(this).html('Fetching');
			$(this).toggleClass('loading');

			$.ajax({
				type: "POST",
				url: $(this).data('api-url'),
				dataType: 'json',
				success: function(data) {
					window.fetchInterval = window.setInterval(function() {
						$.ajax({
							type: "GET",
							url: data.href,
							dataType: 'json',
							success: function(log_data) {
								$('#gitFetchModal .modal-body').html('<pre>' + log_data.message + '</pre>');
								$('#gitFetchModal .modal-footer').html('Status: ' + log_data.status);
								if(log_data.status === 'Failed' || log_data.status === 'Complete') {
									clearInterval(window.fetchInterval);
								}
								if(log_data.status === 'Complete') {
									location.reload();
								}
							}
						});
					}, 2000);
				}
			});
		});

		$('.tooltip-hint, .btn-tooltip').tooltip({
			placement: "top",
			trigger: 'hover'
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
