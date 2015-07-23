<div class="row items-push">
	<div class="col-sm-7">
		<ol class="breadcrumb">
			<li><a href="#">$CurrentProject.Title</a></li>
			<li></li>
		</ol>
		<h1 class="page-heading">
			<% loop $Project.Menu %>
				<% if $IsActive %>$Title<% end_if %>
			<% end_loop %>
		</h1>
	</div>
</div>
