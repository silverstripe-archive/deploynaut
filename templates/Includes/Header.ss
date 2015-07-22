<div class="side-content side-header">
	<a class="brand" href="naut/projects">SilverStripe Platform</a>
</div>

<div class="side-content">
	<%--
	<ul class="nav nav-stacked">
		<li<% if $CurrentProject %><% else %> class="active"<% end_if %>><a href="naut/projects">Stacks</a></li>
	</ul> --%>

	<ul class="nav nav-stacked">

		<% if $DNProjectList %>
			<li class="nav-main-heading">Stacks</li>
			<% loop $DNProjectList %>
				<li class="active">
					<a class="nav-submenu" role="button" data-toggle="collapse" href="#collapseExample-$Pos" aria-expanded="false" aria-controls="collapseExample-$Pos">
  						<span class="icon icon-stack"></span>$Name<span class="icon-arrow"></span>
					</a>

					<ul class="collapse" id="collapseExample-$Pos">

						<% if $Up.CurrentProject %>
						<% loop $Up.CurrentProject.Menu %>
							<li<% if $IsActive %> class="active"<% end_if %>><a href="$Link">$Title</a></li>
						<% end_loop %>
						<% end_if %>
					</ul>
				</li>

			<% end_loop %>
		<% end_if %>

		<li class="nav-main-heading">Support</li>
		
		<li><a href=""><span class="icon icon-helpdesk"></span>Help desk</a></li>
		<li><a href=""><span class="icon icon-documentation"></span>Documentation</a></li>
		<li><a href="http://www.silverstripe.com/platform"><span class="icon icon-overview"></span>Platform overview</a></li>

	</ul>
</div>