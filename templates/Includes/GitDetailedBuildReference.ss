<h3><a href="$URL.URL" target="_blank"><% if $BareURL %>$BareURL<% else %>$URL<% end_if %></a> <a href="$URL.URL" target="_blank"><i class="fa fa-external-link-square"></i></a></h3>
	
<div class="row">
	<div class="col-md-6">
		<ul class="build-details">
			<% if $Environment.Project.RepositoryInterface.CommitURL %>
				<li><a href="{$Environment.Project.RepositoryInterface.CommitURL}/{$SHA}" class="git-sha tooltip-hint">$SHA.ShortHash</a>
				<% if $Committer %><span class="commit-message"> - $Message</span><% end_if %></li>
			<% else %>
				<li><span class="git-sha tooltip-hint">
					$SHA.ShortHash<% if $Committer %><span class="commit-message"> - $Message</span><% end_if %>
				</span></li>
			<% end_if %>

			<li><span class="deploy-date">Deployed on $LastEdited.Nice</span></li>
			<li><a href="$Environment.CurrentBuild.Link">View Deploy Log</a></li>
		</ul>
	</div>

	<div class="col-md-6">
		<ul>

			<%-- Display logs link for environment --%>
			<%--<% if $LogsLink %>--%>
				<li>
					<a href="$LogsLink"><i class="fa fa-table i-push"></i>Logs for $Name</a>
				</li>
			<%--<% end_if %>--%>

			<%-- Display metrics for environment --%>
			<%--<% if $Project.HasMetrics %>--%>
				<li>
					<a href="naut/project/$Project.Name/environment/$Name/metrics">
						<i class="fa fa-bar-chart i-push"></i>Metrics for $Name
					</a>
				</li>
			<%--<% end_if %>--%>

		</ul>
	</div>
</div>
