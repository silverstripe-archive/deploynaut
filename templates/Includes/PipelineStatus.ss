<h3 class="pull-left">Current Deployment</h3>

<div class="btn-toolbar pull-right" id="deployprogress-actions">
	<% if $canAbort %>
	<div class="btn-group">
		<a href="$Link('abort')" id="deployprogress-abort" class="btn btn-warning btn-small"
		 onclick="return confirm('Are you sure you wish to abort this pipeline?');">
			Abort Pipeline
		</a>
	</div>
	<% end_if %>

	<div class="btn-group">
		<a class="btn" href="$Link">View Logs</a>
		<button class="btn dropdown-toggle" data-toggle="dropdown">
			<span class="caret"></span>
		</button>
		<ul class="dropdown-menu">
			<% loop $LogOptions %>
				<li><a href="$Link">$ButtonText</a></li>
			<% end_loop %>
		</ul>
	</div>
</div>

<% if $RunningDescription %>
	<p class="alert alert-info running-description">$RunningDescription</p>
<% end_if %>

<%-- Deployment progress bar --%>
<%-- This doesn't currently allow for FrontendSteps after the NonFrontendSteps --%>
<% uncached %>
<div class="row" id="deployprogress">
	<% loop $Steps %>
	<div class="span3 deployprogress-step <% if $isRunning %>deployprogress-step-active<% end_if %>">
		<p>$NiceName</p>
		<% if $isRunning %>
			<% if $Up.RunningOptions %><% loop $Up.RunningOptions %>
				<a class="btn btn-small $ButtonType btn-tooltip" data-toggle="tooltip" title="$Title" href="$Link"
				   <% if $Confirm %>onclick="return confirm('$Confirm.JS');"<% end_if %>
				   >$ButtonText</a>
			<% end_loop %><% else %>
				<div class="progress progress-striped active">
					<div class="bar" style="width:100%"></div>
				</div>
			<% end_if %>
		<% else_if $isFinished %>
			<% if $Responder %>
			<p>by <em>$Responder.Name</em></p>
			<% end_if %>
		<% end_if %>
	</div>
	<% end_loop %>
</div>

<% end_uncached %>