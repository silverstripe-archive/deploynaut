<ul class="project-links">
	<% if $CurrentProject.RepositoryInterface %><% with $CurrentProject.RepositoryInterface %>
		<li>
			<div class="repo-ux">
				<img src="$Icon" />
				<a href="$URL">View code on $Name</a>
			</div>
		</li>
	<% end_with %><% end_if %>
	<% if $CurrentProject.RepositoryURL %>
		<li>
			<a tabindex="0" data-placement="left" ole="button" data-container="body" data-toggle="popover"  title="Code Repository" data-content="$CurrentProject.RepositoryURL"><i class="fa fa-code i-push"></i> Code repository</a>
		</li>
	<% end_if %>
</ul>