var deploy = (function($) {
	"use strict";

	/**
	 * this is a jQuery object that refers to an object that will start a
	 * git fetch and then display the 'choose' revision form
	 */
	var dropDownSelector;

	/**
	 * This sets up the onClick handler for the dropDown selector
	 */
	var setupOnClickHandler = function() {

		dropDownSelector.on('click', function() {
			// already loaded, just toggle the panel
			if (dropDownSelector.hasClass('success')) {
				dropDownSelector.toggleClass('open');
				$(dropDownSelector.attr('aria-controls')).collapse('toggle');
				return;
			}
			// currently running, ignore click
			if(dropDownSelector.hasClass('loading') || dropDownSelector.hasClass('success')) {
				return;
			}
			dropDownSelector.addClass('loading').removeClass('error');
			startFetch();
		});
	};

	/**
	 * This will start a revision fetch and the result of that call should be a
	 * url where we can poll for the result of the fetch command
	 *
	 */
	var startFetch  = function() {
		$.ajax({
			type: "POST",
			url: dropDownSelector.data('api-url'),
			dataType: 'json',
			success: startFetchStatusPoll
		});
	};

	/**
	 * Get the status of the current fetch and fetch the revision form when it's
	 * finished or abort if there is an error
	 *
	 * @param fetchData
	 */
	var startFetchStatusPoll = function(fetchData) {
		$.ajax({
			type: "GET",
			url: fetchData.href,
			dataType: 'json',
			error: fetchStatusError,
			success: function(data, textStatus) {
				switch (data.status) {
					case "Queued":
					// fall through
					case "Running":
						// wait 1 second and then recurse
						setTimeout(function(){startFetchStatusPoll(fetchData)}, 1000);
						break;
					case "Complete": // fetch the revision form
						getRevisionForm(data);
						break;
					case "Failed": // fetch failed
						fetchStatusError();
						break;
					default:
						console.log(data);
						break;
				}
			}
		});
	};

	/**
	 * This should be called when a fetch job failed
	 */
	var fetchStatusError = function() {
		dropDownSelector.removeClass('loading').addClass('error');
	};

	/**
	 * Get the revision form and display it
	 *
	 * @param data
	 */
	var getRevisionForm = function(data) {
		$.ajax({
			type: 'GET',
			url: dropDownSelector.data('form-url'),
			dataType: 'json',
			success: function(formData) {

				// insert the form HTML
				dropDownSelector.next('.deploy-form-outer').html(formData.Content);

				dropDownSelector.removeClass('loading').addClass('success').toggleClass('open');
				$(dropDownSelector.attr('aria-controls')).collapse();

				// Enable select2
				$('.deploy-form-outer .tab-pane.active select:not(.disable-select2)').select2();

				// Ensure the correct value is set for hidden field "SelectRelease"
				var releaseType = $('.deploy-form-outer .tabbedselectiongroup > li.active a').attr('data-value');
				$('.deploy-form-outer').find('input[name="SelectRelease"]').attr('value', releaseType);
			}
		});
	};

	return {
		init: function (sel) {
			dropDownSelector = $(sel);
			setupOnClickHandler();
		}
	};

})(jQuery);


