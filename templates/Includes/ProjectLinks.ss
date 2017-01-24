<ul class="project-links">
	<% if $HasPerm(ADMIN) && $CurrentEnvironment %>
		<li>
			<i class="fa fa-stethoscope i-push"></i><a target="deploynaut-backend" href="admin/naut/DNProject/EditForm/field/DNProject/item/{$CurrentProject.ID}/ItemEditForm/field/Environments/item/{$CurrentEnvironment.ID}/edit">Edit in CMS</a>
		</li>
	<% end_if %>
	<% if $CurrentProject.listProjectContacts %>
		<li>
			<i class="fa fa-users"></i>
			<a data-placement="left" role="button" data-container="body" data-toggle="popover" title="Project Team" data-html="true" data-content="
<div class='table-responsive'>
	<table class='table'>
		<thead>
			<tr>
				<th>Name</th>
				<th>Role</th>
				<th>Email</th>
			</tr>
		</thead>
		<tbody>
			<% loop $CurrentProject.listProjectContacts %>
				<tr>
					<td>$FirstName.ATT $Surname.ATT</td>
					<td>$RoleTitle.ATT</td>
					<td><a href='mailto:$Email.ATT'>$Email.ATT</a></td>
				</tr>
			<% end_loop %>
		</tbody>
	</table>
</div>" />Project team</a>
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
			<i class="fa fa-code i-push"></i><a tabindex="0" data-placement="left" role="button" data-container="body" data-toggle="popover"  title="Git Clone URL" data-content="$CurrentProject.RepositoryURL">Git clone URL</a>
		</li>
	<% end_if %>
</ul>

