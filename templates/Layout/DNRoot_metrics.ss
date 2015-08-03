<style>
.graphgroup {
	float: left;
	background-color: #000;
	margin: 15px 0 0 15px;
	padding: 0 15px 15px 15px;
	border-radius: 15px;
	width: 765px;
}
.graphgroup h4 {
	color: white;
}
</style>

<h3><a href="naut/project/$CurrentProject.Name">$CurrentProject.Name</a>:<a href="naut/project/$CurrentProject.Name/environment/$Name">$Name</a></h3>
<h4>Metric dashboard</h4>

<% loop GraphServers %>
	<div class="span12 graphgroup">
	<h4>$ServerName<h4>
	<% loop Graphs %>
		$Graph
	<% end_loop %>
	</div>
<% end_loop %>
