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
			<% loop $Navigation %>
				<li class="active">
					<a class="nav-submenu" role="button" data-toggle="collapse" href="#collapseExample-$Pos" aria-controls="collapseExample-$Pos">
  						<span class="icon icon-stack"></span>$Project.Name<span class="icon-arrow"></span>
					</a>

					<ul class="collapse<% if $IsActive %> in<% end_if %>" id="collapseExample-$Pos">
						<% loop $Project.Menu %>
							<li<% if $IsSection %> class="active"<% end_if %>>
								<a href="$Link">$Title</a>
							</li>
						<% end_loop %>
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
