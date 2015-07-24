<div class="row">
	<div class="col-sm-7">
		<ol class="breadcrumb">
			<li><a href="naut/project/$CurrentProject.Name">$CurrentProject.Title</a></li>
		</ol>
		<h1 class="page-heading">
			$Title Page header needs fix
		</h1>

		<% if $ShowEnvironmentList == "true" %>
			<% with $CurrentProject %>
			<ul class="nav nav-tabs">
				<% if $DNEnvironmentList %>
					<% loop $DNEnvironmentList %>
						<li<% if $Top.Name = $Name %> class="active"<% end_if %>><% if CanDeploy %><a href="$Link">$Name</a><% else %>$Name<% end_if %></li>
					<% end_loop %>
				<% end_if %>
			</ul>
			<% end_with %>
		<% end_if %>

	</div>
</div>
