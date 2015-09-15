<ol class="breadcrumb">
	<% if $CurrentEnvironment %>
		<li>$CurrentProject.Title &raquo; environments</li>
	<% else %>
		<li>$CurrentProject.Title</li>
	<% end_if %>
</ol>
<h1 class="page-heading">

	<% if $CurrentEnvironment %>
		$CurrentEnvironment.Title
	<% else %>
		$CurrentProject.CurrentMenu.Title
	<% end_if %>
</h1>
