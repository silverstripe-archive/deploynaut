var deploy = (function ($) {
	"use strict";

	/**
	 * this is a jQuery object that refers to an object that will start a
	 * git fetch and then display the 'choose' revision form
	 */
	var fetchButton;


	/**
	 * this is a jQuery object that refers the element where the form should be
	 * placed
	 */
	var formContainerSelector;

	/**
	 * This sets up the onClick handler for the git fetch/update element
	 */
	var gitUpdateOnClick = function () {

		fetchButton.on('click', function () {
			// already loaded, just toggle the panel
			if (fetchButton.hasClass('success')) {
				fetchButton.toggleClass('open');
				$(fetchButton.attr('aria-controls')).collapse('toggle');
				return;
			}
			// currently running, ignore click
			if (fetchButton.hasClass('loading') || fetchButton.hasClass('success')) {
				return;
			}

			fetchButton.addClass('loading').removeClass('error');

			var startFetch = $.ajax({
				type: "POST",
				url: fetchButton.data('api-url'),
				dataType: 'json'
			});

			startFetch
				.fail(fetchStatusError)
				.then(waitForFetchToComplete)
				.fail(fetchStatusError)
				.done(function () {
					getRevisionForm()
						.done(function (formData) {
							// insert the form HTML
							fetchButton.next(formContainerSelector).html(formData.Content);

							fetchButton.removeClass('loading').addClass('success').toggleClass('open');
							$(fetchButton.attr('aria-controls')).collapse();

							setupSelect2();
							tabChange();
							deployButtonClick();
						});
				});
		});
	};

	var deployButtonClick = function () {
		$("form .deploy-button").on('click', function () {
			var releaseType = $(this).parents('form').find('input[name="SelectRelease"]').attr('value');

			var environment = $(this).attr('data-environment-name');
			var revision = $(this).parents('form').find('*[name="' + releaseType + '"]').val();

			return confirm('You are about to begin the following deployment:\n\n'
				+ 'Environment: ' + environment + '\n'
				+ 'Revision: ' + revision + '\n\n'
				+ 'Continue?');
		});
	};

	/**
	 * Setup handlers for when the choosen revision changes
	 */
	var setupSelect2 = function () {
		// Ensure the correct value is set for hidden field "SelectRelease"
		var releaseType = $(formContainerSelector + ' .tabbedselectiongroup > li.active a').attr('data-value');
		$(formContainerSelector).find('input[name="SelectRelease"]').attr('value', releaseType);

		// Enable select2
		$(formContainerSelector + ' .tab-pane.active select:not(.disable-select2)').select2();

		// setup a change handler for the select2 dropdowns
		$(formContainerSelector + ' .tab-pane select:not(.disable-select2)').on("change", revisionChanged);

		// setup any text field to
		var elem = $(formContainerSelector + ' .tab-pane input#DeployForm_DeployForm_SHA');
		// Save current value of element
		elem.data('oldVal', elem.val());

		elem.on("propertychange change click keyup input paste", function (event) {

			if (elem.data('oldVal') === elem.val()) {
				console.log('oldvalue = newvalue ' + elem.data('oldVal') + ' ' + elem.val());
				return;
			}

			if (elem.val().length === 40) {
				revisionChanged(event);
			} else {
				removeActiveDeployForm();
			}
		});

		// Ensure the correct value is set for hidden field "SelectRelease"
		$(formContainerSelector).find('input[name="SelectRelease"]').attr('value', releaseType);
	};

	/**
	 * setup handlers for when the active tab changes
	 */
	var tabChange = function () {
		$(formContainerSelector).on('click', '.tabbedselectiongroup > li > a', function () {
			// Set the release type.
			$(this).parents('form').find('input[name="SelectRelease"]').attr('value', $(this).attr('data-value'));
			$(this).tab('show');

			// this will clear out the old value and since we trigger a change event will also remove the old form
			$(formContainerSelector + ' .tab-pane.active select:not(.disable-select2)').val(null).trigger('change');

			// Enable select2
			$(formContainerSelector + ' .tab-pane.active select:not(.disable-select2)').select2();

			return false;
		});
	};

	/**
	 * Set up handlers for when the choosen revision changes and load the deploy form
	 */
	var revisionChanged = function (evt) {

		removeActiveDeployForm();

		if (evt.target.value === '') {
			return;
		}

		var revisionForm = $(formContainerSelector + ' form');
		var form = $.post(revisionForm.attr('action'), revisionForm.serialize());
		form.done(function (data) {
			$(formContainerSelector + " .tab-pane.active").append(data.Content);
		})
	};

	/**
	 *
	 */
	var removeActiveDeployForm = function () {
		var activeTab = $(formContainerSelector + " .tab-pane.active");
		if (activeTab.find('form').length) {
			activeTab.find('form').each(function (idx, form) {
				form.remove();
			});
		}
	};

	/**
	 * Get the status of the current fetch and fetch the revision form when it's
	 * finished or abort if there is an error
	 *
	 * @param fetchData
	 */
	var waitForFetchToComplete = function (fetchData) {
		return getFetchStatus(fetchData).then(function (data) {
			if (data.status === "Complete") {
				return data;
			}
			if (data.status === "Failed") {
				return $.Deferred(function (d) {
					return d.reject();
				}).promise();
			}
			return waitForFetchToComplete(fetchData);
		});
	};

	/**
	 *
	 * @param fetchData
	 * @returns $.Deferred.Promise()
	 */
	var getFetchStatus = function (fetchData) {
		return $.ajax({
			type: "GET",
			url: fetchData.href,
			dataType: 'json'
		});
	};

	/**
	 * This should be called when a fetch job failed
	 */
	var fetchStatusError = function () {
		fetchButton.removeClass('loading').addClass('error');
	};

	/**
	 * Get the revision form and display it
	 *
	 */
	var getRevisionForm = function () {
		return $.ajax({
			type: 'GET',
			url: fetchButton.data('form-url'),
			dataType: 'json'
		});
	};

	return {
		init: function (fetchButtonSel, formSel) {
			fetchButton = $(fetchButtonSel);
			formContainerSelector = formSel;
			gitUpdateOnClick();
		}
	};

})(jQuery);


