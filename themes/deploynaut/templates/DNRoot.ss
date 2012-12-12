<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<% base_tag %>
		<title>Deploynaut</title>
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta name="description" content="">
		<% require themedCSS(bootstrap) %>
		<% require themedCSS(deploynaut) %>
		<meta name="author" content="SilverStripe LTD">
		<!-- Le HTML5 shim, for IE6-8 support of HTML5 elements -->
		<!--[if lt IE 9]>
		  <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
		<![endif]-->
		<style>
			
		</style>
	</head>

	<body>
		<div class="navbar navbar-fixed-top">
			<div class="navbar-inner">
				<div class="container">
					<a class="brand" href="naut/projects">deploynaut<sup>&trade;</sup></a>
					<ul class="nav">
						<li><a href="naut/projects">projects</a></li>
					</ul>
				</div>
			</div>
			<div class="container">
				<div class="pull-right">
					<% if RedisUnavailable %>
					<p class="text-error">Can't connect to redis: "$RedisUnavailable"</p>
					<% else %>
						<% if $RedisWorkersCount %>
						<p class="muted">$RedisWorkersCount worker(s) connected</p>
						<% else %>
						<p class="text-error">No workers connected</p>
						<% end_if %>
					<% end_if %>
				</div>
			</div>
		</div>

		<div class="container">
			$Layout
		</div>

	</body>
</html>
