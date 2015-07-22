<!doctype html>
<html>
<head>
	<% base_tag %>
</head>
<body>
	<div class="body">
		<p>Hi,</p>
		<p>A command failed to execute correctly in <a href="$BaseHref/naut/project/{$Environment.Project.Name}/environment/{$Environment.Name}/">$FullName</a>.</p>
		<p>Here is the tail of the log:</p>
		<pre>$Log</pre>
	</div>
</body>
</html>

