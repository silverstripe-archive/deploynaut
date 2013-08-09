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

<h3><a href="naut/project/$Project.Name">$Project.Name</a>:<a href="naut/project/$Project.Name/environment/$Name">$Name</a></h3>
<h4>Metric dashboard</h4>

<% control GraphServers %>
	<div class="span12 graphgroup">
	<h4>$ServerName<h4>
	<% control Graphs %>
		$Graph
	<% end_control %>
	</div>
<% end_control %>
