<div class="content page-header">
	<div class="row">
		<div class="col-md-12">
			<% include Breadcrumb %>
			<% include DeploymentTabs %>
			<% include ProjectLinks %>
		</div>
	</div>
</div>

<div class="content">
	<div class="row">
		<div class="col-md-12 environment-details">
			<a href="$CurrentEnvironment.Link"><i class="fa fa-long-arrow-left"></i> Back to environment</a>
		</div>
	</div>

<% if $Deployment %>
	<% with $Deployment %>
		<div class="deployment-status">
			<div class="progress deployment-progress">
				<div class="progress-bar
					<% if $Status=='Deploying' || $Status=='Aborting' %>
						progress-bar-striped active
					<% end_if %>
					$Status" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" id="queue_action">

					<% if $Status=='New' %>
						New deployment to $Environment.Name
					<% else %>
						Deployment to $Environment.Name <span class="jobstatus">$Status.LowerCase</span>
					<% end_if %>
					<span class="status"><a href="#" id="current-build-toggle">View details <i class="fa fa-caret-down"></i></a></span>
				</div>
			</div>
		</div>

		<div class="table-responsive current-build-data hide">
			<table class="table table-striped table-hover">
				<tbody>
					<% loop $Changes %>
						<tr>
							<th>$Name</th>
							<% if $Description %>
								<td colspan="4">$Description</td>
							<% else %>
								<td>$From</th>
								<td><% if $Changed %><span class="glyphicon glyphicon-arrow-right"></span><% else %>&nbsp;<% end_if %></td>
								<td><% if $Changed %>$To<% else %><span class="label label-success">Unchanged</span><% end_if %></td>
								<td><% if $CompareUrl %><a href="$CompareUrl">View diff<i className="fa fa-external-link-square superscript"></i></a><% else %>&nbsp;<% end_if %></td>
							<% end_if %>
						</tr>
					<% end_loop %>
				</tbody>
			</table>
		</div>

		<% if $HasPerm(ADMIN) %>
			<% if $Status=='Queued' || $Status=='Deploying' || $Status=='Aborting' %>
				<button value="Abort" class="btn btn-danger abort pull-right" data-url="$Link/abort-deploy" data-terminate="Force abort">
					<% if $Status=='Aborting' %>
						Force abort
					<% else %>
						Abort
					<% end_if %>
				</button>
			<% end_if %>
		<% end_if %>

		<h5>Deploy log:</h5>
		<pre id="queue_log" class="log-content" data-loglink="$LogLink">$LogContent.XML</pre>
	<% end_with %>
<% end_if %>

</div>
