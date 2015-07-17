<div class="side-content side-header">
	<a class="brand" href="naut/projects">SilverStripe Platform</a>
</div>

<div class="side-content">
	<%--
	<ul class="nav nav-stacked">
		<li<% if $CurrentProject %><% else %> class="active"<% end_if %>><a href="naut/projects">Stacks</a></li>
	</ul> --%>

	<ul class="nav nav-stacked">

	<% if DNProjectList %>
		<li class="nav-main-heading">STACKS</li>
		<% loop DNProjectList %>
			<li><a href="$Link">$Name</a></li>
		<% end_loop %>
	<% end_if %>

	</ul>
</div>