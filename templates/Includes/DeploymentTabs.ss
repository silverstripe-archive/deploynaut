<% if $CurrentEnvironment && $CurrentEnvironment.Menu %>
	<div class="scroller scroller-left"><i class="fa fa-angle-left"></i></div>
	<div class="scroller scroller-right"><i class="fa fa-angle-right"></i></div>

	<div class="wrapper">
		<ul class="nav nav-tabs tabs">
			<% loop $CurrentEnvironment.Menu %>
				<li<% if $IsSection %> class="active"<% end_if %>><a href="$Link">$Title</a></li>
			<% end_loop %>
		</ul>
	</div>
<% end_if %>
