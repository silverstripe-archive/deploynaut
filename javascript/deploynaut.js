/*jslint white: true, browser: true, nomen: true, devel: true */
/*global jQuery: false */
(function($) {
	"use strict";

	// Popover on enviroment repository link
	$(function () {
		$('[data-toggle="popover"]').popover()
	});

	// Openclose nav
	$('button.sidebar-open').on('click', function(e) {
		$('.page-container').toggleClass("open"); // you can list several class names
		e.preventDefault();
	});

	// Scrolling tabs
	if($('.list').length > 0) {
		var hidWidth;
		var scrollBarWidths = 40;

		var widthOfList = function(){
			var itemsWidth = 0;
			$('.list li').each(function(){
				var itemWidth = $(this).outerWidth();
				itemsWidth+=itemWidth;
			});
			return itemsWidth;
		};

		var widthOfHidden = function(){
			return (($('.wrapper').outerWidth())-widthOfList()-getLeftPosi())-scrollBarWidths;
		};

		var getLeftPosi = function(){
			return $('.list').position().left;
		};

		var reAdjust = function(){
			if (($('.wrapper').outerWidth()) < widthOfList()) {
				$('.scroller-right').show();
			} else {
				$('.scroller-right').hide();
			}

			if (getLeftPosi()<0) {
				$('.scroller-left').show();
			} else {
				$('.item').animate({left:"-="+getLeftPosi()+"px"},'slow');
				$('.scroller-left').hide();
			}
		}

		reAdjust();

		$(window).on('resize',function(e){
			reAdjust();
		});

		$('.scroller-right').click(function() {
			$('.scroller-left').fadeIn('slow');
			$('.scroller-right').fadeOut('slow');
			$('.list').animate({left:"+="+widthOfHidden()+"px"},'slow',function(){
			});
		});

		$('.scroller-left').click(function() {
			$('.scroller-right').fadeIn('slow');
			$('.scroller-left').fadeOut('slow');
			$('.list').animate({left:"-="+getLeftPosi()+"px"},'slow',function(){
			});
		});
	}

	var queue = {
		autoScroll: true,
		showlog: function(status, content, logLink) {
			var self = this;
			//add scroll listener
			content.on('scroll', function(ev) {
				// if we are scrolled to the bottom then autoScroll should be on otherwise we've scrolled somewhere else
				// and we shouldn't move the scroll any more
				if (content.scrollTop() >= (content[0].scrollHeight - content.innerHeight())) {
					self.autoScroll = true;
				}
				else {
					self.autoScroll = false;
				}
			});
			$.getJSON(logLink, {randval: Math.random()},
			function(data) {
				status.text(data.status);
				content.text(data.content);
				//scroll the content to the bottom
				if (self.autoScroll) {
					content.scrollTop(content[0].scrollHeight);
					//we have to re-enable autoscroll because we'll have triggered a scroll event
					self.autoScroll = true;
				}
				$(status).parent().addClass(data.status);
				$('title').text(data.status + " | Deploynaut");
				if (data.status == 'Complete' || data.status == 'Failed' || data.status == 'Invalid') {
					$(status).parent().removeClass('Running Queued progress-bar-striped active');
					//detach scroll listener
					content.off('scroll');
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

		// Deployment screen
		if ($('#queue_log').length) {
			queue.start();
		}

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
			var $el = $($(this).data('extendedTarget'));
			var $container = $($(this).data('extendedContainer'));

			if($el.is(':empty')) {
				$container.data('href', $(this).attr('href'));
				$container.addClass('loading');

				$el.load($(this).attr('href'), function() {
					$container.removeClass('loading');
					$el.removeClass('hide');
					$el.find('select').select2();
				});
			} else {
				$el.empty();
				$el.addClass('hide');

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

		$('.upload-exceed-link').on('click', function() {
			$(this).tab('show');

			var id = $(this).attr('data-target');
			$(id).find('select').select2();
			return false;
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
