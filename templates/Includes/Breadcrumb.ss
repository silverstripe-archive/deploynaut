<ol class="breadcrumb">
	<% if $CurrentEnvironment %>
		<li>$CurrentProject.Title</li>
	<% else %>
		<li>$CurrentProject.Title</li>
	<% end_if %>
</ol>
<h1 class="page-heading">
	<% if $CurrentEnvironment %>
		<% with $CurrentEnvironment %>
			$Title <a target="_blank" href="$URL.URL"><% if $BareURL %>$BareURL<% else %>$URL<% end_if %></a>
		<% end_with %>
	<% else %>
		<% if $CurrentProject.CurrentMenu %>
			$CurrentProject.CurrentMenu.Title
		<% else %>
			<% if $CurrentTitle %>
				$CurrentTitle
			<% else %>
				Overview
			<% end_if %>
		<% end_if %>
	<% end_if %>
</h1>
