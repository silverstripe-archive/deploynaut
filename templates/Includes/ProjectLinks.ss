<% if $CurrentProject %>
<ul class="project-links">
	<% if $HasPerm(ADMIN) && $CurrentEnvironment %>
		<li>
			<i class="fa fa-sign-in i-push"></i><a target="deploynaut-backend" href="admin/naut/DNProject/EditForm/field/DNProject/item/{$CurrentProject.ID}/ItemEditForm/field/Environments/item/{$CurrentEnvironment.ID}/edit">Edit in CMS</a>
		</li>
	<% end_if %>
	<% if $CurrentProject.RepositoryInterface %><% with $CurrentProject.RepositoryInterface %>
		<li>
			<div class="repo-ux">
				<img class="i-push" src="$Icon" /><a href="$URL">View code on $Name</a>
			</div>
		</li>
	<% end_with %><% end_if %>
	<% if $CurrentProject.RepositoryURL %>
		<li>
			<i class="fa fa-code i-push"></i><a tabindex="0" data-placement="left" role="button" data-container="body" data-toggle="popover"  title="Git Clone URL" data-content="$CurrentProject.RepositoryURL">Git Clone URL</a>
		</li>
	<% end_if %>
</ul>
<% end_if %>
