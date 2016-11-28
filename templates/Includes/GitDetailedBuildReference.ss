<% if $Environment.CurrentBuild %>
	<div class="row">
		<div class="col-md-6">
			<a href="#" id="current-build-toggle">Current build details <i class="fa fa-caret-down"></i></a>
			<div class="table-responsive hide current-build-data">
				<table class="table">
					<tr>
						<th>Code version</th>
						<td>
							<% if $Tags %>
								<% loop $Tags %>
									<span class="deployment-tag">$Me</span>
								<% end_loop %>
							<% end_if %>
							<% if $RefName %>
								<span class="deployment-branch">
									$RefName
								</span>
							<% end_if %>
							<% if $Environment.Project.RepositoryInterface.CommitURL %>
								<a href="{$Environment.Project.RepositoryInterface.CommitURL}/{$SHA}" class="git-sha tooltip-hint">$SHA.ShortHash</a>
							<% else %>
								$SHA.ShortHash
							<% end_if %>
						</td>
					</tr>
					<% if $Message %>
						<tr>
							<th>Commit message</th>
							<td>$Message</td>
						</tr>
					<% end_if %>
					<% if $Environment.CurrentBuild.DeploymentStrategy.getChange("Infrastructure version") %>
						<tr>
							<th>Infrastructure version</th>
							<td>$Environment.CurrentBuild.DeploymentStrategy.getChange("Infrastructure version").to</td>
						</tr>
					<% end_if %>
					<% if $HasPerm(ADMIN) %>
						<tr>
							<th>Layout version</th>
							<td>$Environment.layoutVersion</td>
						</tr>
					<% end_if %>
					<% if $Environment.CurrentBuild.DeploymentStrategy.getChange("Base image") %>
						<tr>
							<th>Base image</th>
							<td>$Environment.CurrentBuild.DeploymentStrategy.getChange("Base image").to</td>
						</tr>
					<% end_if %>
					<tr>
						<th>Deployment date</th>
						<td>$LastEdited.Nice</td>
					</tr>
					<% if $Environment.CurrentBuild.Link %>
						<tr>
							<td colspan="2" class="text-center">
								<a href="$Environment.CurrentBuild.Link">View deployment log</a>
							</td>
						</tr>
					<% end_if %>
				</table>
			</div>
		</div>

		<div class="col-md-6">
			<ul>
				<%-- Display logs link for environment --%>
				<% if $Environment.LogsLink %>
					<li>
						<a href="$Environment.LogsLink"><i class="fa fa-table i-push"></i>Server logs for $Environment.Name</a>
					</li>
				<% end_if %>
			</ul>
		</div>
	</div>
<% end_if %>
