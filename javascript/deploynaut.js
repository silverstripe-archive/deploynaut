/*jslint white: true, browser: true, nomen: true, devel: true */
/*global jQuery: false */
(function($) {
	"use strict";
	
	var deploy = {
		showlog: function ($status, $content, logLink) {
			var self = this;
			$.getJSON(logLink, { randval: Math.random()},
				function(data){
					$status.text(data.status);
					$content.text(data.content);
					$status.attr('class', data.status);
					$('title').text('Deployment is ' + data.status);
					if(data.status === 'Complete') {
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
			window._deploy_refresh = window.setInterval(function() {
				self.showlog($("#deploy_action"), $("#deploy_log"), $('#deploy_log').data('loglink'));
			}, 3000);
		},

		/**
		 * Will remove the pinging and refresh of the application list
		 */
		_clearInterval: function() {
			window.clearInterval(window._deploy_refresh);
		}
	};

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
		});
		$('#Form_DeployForm_action_doDeploy').click(function() {
			return confirm('Are you sure that you want to deploy?');
		});
		
		// Deployment screen
		if($('#deploy_log').length) {
			deploy.start();
		}

		$('.project-branch > h3').click(function() {
			var $project = $(this).parent();
			if($project.hasClass('open')) {
				$project.removeClass('open');
			} else {
				$project.addClass('open');
			}
		});

		$('a.update-repository').click(function(e){
			e.preventDefault();

			$(this).attr('disabled', 'disabled');
			$(this).html('Fetching');
			$(this).toggleClass('loading');
			$.get($(this).attr('href'), function(){
				location.reload();
			});
		});
		
		$('.tooltip-hint').tooltip({
			placement: "top",
			trigger: 'hover'
		});
	});
}(jQuery));