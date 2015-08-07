<div class="scroller scroller-left"><i class="fa fa-angle-left"></i></div>
<div class="scroller scroller-right"><i class="fa fa-angle-right"></i></div>

<div class="wrapper">
	<ul class="nav nav-tabs list" id="myTab">
		<li<% if $Overview %> class="active"<% end_if %>><a href="$CurrentProject.Link">Overview</a></li>

		<% with $CurrentProject %>
			<% if $DNEnvironmentList %>
				<% loop $DNEnvironmentList %>
					<li<% if $IsSection %> class="active"<% end_if %>><a href="$Link">$Name</a></li>
				<% end_loop %>
			<% end_if %>
		<% end_with %>
	</ul>
</div>