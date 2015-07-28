<% if $IncludeFormTag %>
	<form $AttributesHTML>
<% end_if %>

	<% if $Message %>
		<p id="{$FormName}_error" class="message $MessageType">$Message</p>
	<% else %>
		<p id="{$FormName}_error" class="message $MessageType" style="display: none"></p>
	<% end_if %>

	<% if $Legend %><legend>$Legend</legend><% end_if %>
	<% loop $Fields %>
		$FieldHolder
	<% end_loop %>

	<% if $Actions %>
		<div class="Actions">
			<% loop $Actions %>
				$Field
			<% end_loop %>
		</div>
	<% end_if %>

<% if $IncludeFormTag %>
	</form>
<% end_if %>
