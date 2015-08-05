<% if $Environment.Project.RepositoryInterface.CommitURL %>
	<a href="{$Environment.Project.RepositoryInterface.CommitURL}/{$SHA}"
<% else %>
	<span
<% end_if %>
		class="git-sha tooltip-hint"
		data-toggle="tooltip"
		title="$SHA.FullHash"
	>
		$SHA.ShortHash<!--
<% if $Environment.Project.RepositoryInterface %>
	--></a>
<% else %>
	--></span>
<% end_if %>

$CommitMessage