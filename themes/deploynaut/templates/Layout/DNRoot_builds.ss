<ul id="main-nav">
	<li class="current"><a href="{$Link}builds">Builds</a></li>
	<li><a href="{$Link}environments">Environments</a></li>
</ul>

<article id="content">
	<table>
		<thead>
			<tr><th>Build</th><th>Created</th><th>Currently on</th><th>Has this ever gone live?</th></tr>
		</thead>
		<tbody>
		<% loop DNBuilds %>
			<tr>
				<td>$Name</td>
				<td>$Created.Nice</td>
				<td>
					<% control CurrentlyDeployedTo %>
					$Name<% if not $Last %>,<% end_if %>
					<% end_control %>
				</td>
				<td>
					<% if $EverDeployedTo(live) %>yes<% end_if %>
				</td>
			</tr>
		<% end_loop %>
		</tbody>
	</table>
</article>