<ul class="project-links">
	<% if $CurrentProject.RepositoryInterface %><% with $CurrentProject.RepositoryInterface %>
		<li>
			<div class="repo-ux">
				<img class="i-push" src="$Icon" />
				<a href="$URL" target="_blank">View code on $Name</a>
			</div>
		</li>
	<% end_with %><% end_if %>
	<% if $CurrentProject.RepositoryURL %>
		<li>
			<i class="fa fa-code i-push"></i><a tabindex="0" data-placement="left" role="button" data-container="body" data-toggle="popover"  title="Code Repository" data-content="$CurrentProject.RepositoryURL">Code repository</a>
		</li>
	<% end_if %>
</ul>
