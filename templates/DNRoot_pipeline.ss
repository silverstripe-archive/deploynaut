<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<% base_tag %>
	<title>Deploynaut</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="description" content="">
	<% require themedCSS(bootstrap,deploynaut) %>
	<% require themedCSS(deploynaut,deploynaut) %>
	<meta name="author" content="SilverStripe LTD">
	<!-- Le HTML5 shim, for IE6-8 support of HTML5 elements -->
	<!--[if lt IE 9]>
	<script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
	<![endif]-->
</head>

<body>
<div class="container">
	<div class="navbar">
		<% include Header %>
	</div>
	<% include RedisStatus %>
	<% include Pipeline %>
</div>
</body>
</html>

