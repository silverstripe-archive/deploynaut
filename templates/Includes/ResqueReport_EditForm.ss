<% if IncludeFormTag %>
<form $FormAttributes data-layout-type="border">
<% end_if %>
	<% with Controller %>
		$EditFormTools
	<% end_with %>

	<div class="cms-content-fields center <% if not $Fields.hasTabset %>cms-panel-padded<% end_if %>">
		<% if Message %>
		<p id="{$FormName}_error" class="message $MessageType">$Message</p>
		<% else %>
		<p id="{$FormName}_error" class="message $MessageType" style="display: none"></p>
		<% end_if %>

		<fieldset>
			<% if Legend %><legend>$Legend</legend><% end_if %>
			<% loop Fields %>
				$FieldHolder
			<% end_loop %>
			<div class="clear"><!-- --></div>
		</fieldset>
	</div>

	<div class="cms-content-actions cms-content-controls south">
		<% if Actions %>
		<div class="Actions">
			<% loop Actions %>
				$Field
			<% end_loop %>
			<% if Controller.LinkPreview %>
			<a href="$Controller.LinkPreview" class="cms-preview-toggle-link ss-ui-button" data-icon="preview">
				<% _t('LeftAndMain.PreviewButton', 'Preview') %> &raquo;
			</a>
			<% end_if %>
		</div>
		<% end_if %>
	</div>
<% if IncludeFormTag %>
</form>
<% end_if %>
