<div class="git-committer">
	Committed by $Committer on $CommitDate
</div>
<div>
<% if $Environment.Project.RepositoryInterface.CommitURL %>
	<a href="{$Environment.Project.RepositoryInterface.CommitURL}/{$SHA}"
<% else %>
	<span
<% end_if %>
		class="git-sha tooltip-hint"
	>$SHA.FullHash<!--
<% if $Environment.Project.RepositoryInterface %>
	--></a>
<% else %>
	--></span>
<% end_if %>
</div>
<p>
	$Message
</p>

