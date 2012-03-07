<ul id="main-nav">
	<li><a href="{$Link}builds">Builds</a></li>
	<li class="current"><a href="{$Link}environments">Environments</a></li>
</ul>

<article id="content">
	<% with DNEnvironment %>
	<h2>$Name</h2>
	<% if CurrentBuild %>
	<p>Currently running <strong>$CurrentBuild</strong>.</p>
	<% else %>
	<p>New environment - deploy your first build.</p>
	<% end_if %>
	<% end_with %>

	<div class="right-half">
		<h3>Deploy history</h3>
		<table>
			<thead>
				<tr><th>Build</th><th>Date</th></tr>
			</thead>
			<tbody>
			<% loop DNEnvironment.DeployHistory %>
				<tr>
					<td>$BuildName</td>
					<td>$DateTime.Nice</td>
				</tr>
			<% end_loop %>
			</tbody>
		</table>
	</div>
	
	<div class="left-half">
		<h3>Deploy a new release</h3>
		<% with DeployForm %>
		<form $FormAttributes>
			<% loop VisibleFields %>$Field<% end_loop %>
			$HiddenFields
			$Actions
		</form>
		<% end_with %>
	</div>
	
	<div class="spacer"></div>
</article>