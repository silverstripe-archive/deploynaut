<h3>
	<a href="$URL.URL" target="_blank" class="text-muted">
		<% if $BareURL %>$BareURL<% else %>$URL<% end_if %>
	</a>
</h3>
	
<div class="row">
	<div class="col-md-6">
		<h4>Currently deployed:</h4>
		<ul class="build-details">
			<li>
			<% if $Environment.Project.RepositoryInterface.CommitURL %>
				<% if $Tags %>
					<% loop $Tags %>
						<span class="deployment-tag">$Me</span>
					<% end_loop %>
				<% end_if %>
				<a href="{$Environment.Project.RepositoryInterface.CommitURL}/{$SHA}" class="git-sha tooltip-hint">$SHA.ShortHash</a>
				<span class="commit-message"> - $Message</span>
			<% else %>
				<span class="git-sha tooltip-hint">
					<% if $Tags %>
						<% loop $Tags %>
							<span class="deployment-tag">$Me</span>
						<% end_loop %>
					<% end_if %>
					$SHA.ShortHash<span class="commit-message"> - $Message</span>
				</span>
			<% end_if %>
			</li>

			<li>
				<span class="deploy-date">Deployed on $LastEdited.Nice</span>. <a href="$Environment.CurrentBuild.Link">View deploy log</a>
			</li>
		</ul>
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
