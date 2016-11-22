<% if $Tags %>
	<% loop $Tags %>
		<span class="deployment-tag">
			$Me
		</span>
	<% end_loop %>
<% end_if %>

<% if $Branch %>
	<span class="deployment-branch">
		$Branch
	</span>
<% end_if %>

<% if $Environment.Project.RepositoryInterface.CommitURL %>
	<a href="{$Environment.Project.RepositoryInterface.CommitURL}/{$SHA}"
<% else %>
	<span
<% end_if %>
		class="git-sha tooltip-hint"
		data-toggle="tooltip"
		title="$SHA.FullHash"
	>$SHA.ShortHash
<% if $Environment.Project.RepositoryInterface %>
	</a>
<% else %>
	</span>
<% end_if %>

$CommitSubjectMessage
