<div class="build-details">
	<a class="text-muted title" href="$URL.URL" target="_blank"><% if $BareURL %>$BareURL<% else %>$URL<% end_if %></a>

	<% if $Environment.Project.RepositoryInterface.CommitURL %>
		<a href="{$Environment.Project.RepositoryInterface.CommitURL}/{$SHA}" class="git-sha tooltip-hint">
			$SHA.ShortHash
		</a>
		<% if $Committer %><span class="commit-message"> - $Message</span><% end_if %>
	<% else %>
		<span class="git-sha tooltip-hint">
			$SHA.ShortHash<% if $Committer %><span class="commit-message"> - $Message</span><% end_if %>
		</span>
	<% end_if %>

	<span class="deploy-date">Deployed on $LastEdited.Nice</span>
	<a href="$Environment.CurrentBuild.Link">View Deploy Log</a>
</div>
