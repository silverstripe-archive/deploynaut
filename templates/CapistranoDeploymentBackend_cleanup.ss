<!doctype html>
<html>
<head>
	<% base_tag %>
</head>
<body>
	<div class="body">
		<p>Hi,</p>
		<p>Latest deployment on <a href="$BaseHref/naut/project/$ProjectName/environment/$EnvironmentName/">
			$ProjectName:$EnvironmentName</a> failed to remove old releases.</p>
		<p>Here is the tail of the log:</p>
		<pre>$Log</pre>
	</div>
</body>
</html>

