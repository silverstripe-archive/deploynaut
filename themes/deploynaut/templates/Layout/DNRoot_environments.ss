<ul id="main-nav">
	<li><a href="{$Link}builds">Builds</a></li>
	<li class="current"><a href="{$Link}environments">Environments</a></li>
</ul>

<article id="content">
	<table>
		<thead>
			<tr><th>Environment</th><th>Current build</th></tr>
		</thead>
		<tbody>
		<% control DNEnvironments %>
			<tr>
				<td><a href="$Link">$Name</a></td>
				<td>$CurrentBuild</td>
			</tr>
		<% end_control %>
		</tbody>
	</table>
</article>