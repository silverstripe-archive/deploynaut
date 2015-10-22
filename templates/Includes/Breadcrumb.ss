<ol class="breadcrumb">
	<% if $CurrentEnvironment %>
		<li>$CurrentProject.Title</li>
		<li><a href="$CurrentProject.Link">Environments</a></li>
	<% else %>
		<li>$CurrentProject.Title</li>
	<% end_if %>
</ol>
<h1 class="page-heading">
	<% if $CurrentEnvironment %>
		$CurrentEnvironment.Title
	<% else %>
		<% if $CurrentProject.CurrentMenu %>
			$CurrentProject.CurrentMenu.Title
		<% else %>
			<% if $CurrentTitle %>
				$CurrentTitle
			<% else %>
				Environments
			<% end_if %>
		<% end_if %>
	<% end_if %>
</h1>
<% if $Subtitle %>
	<p>$Subtitle</p>
<% end_if %>
