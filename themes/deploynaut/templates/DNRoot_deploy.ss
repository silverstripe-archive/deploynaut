<!DOCTYPE html>
<html>
<head>
	<% base_tag %>
	 <title>Deploynaut</title>
	<% require themedCSS(deploynaut) %>
</head>
<body>
<div id="all">
	<h1>Deploynaut</h1>
	
	
	<ul id="main-nav">
		<li><a href="{$Link}builds">Builds</a></li>
		<li><a href="{$Link}environments">Environments</a></li>
	</ul>

<article id="content">
	<div>Currently deploying <strong class="buildfullname">$BuildFullName</strong> to <strong class="environmentname" >$EnvironmentName</strong></div>
	<div>This buildfile will be used: <strong class="buildfilename">$BuildFileName</strong></div>
	<h5>Executing:</h5>
	
	<div id="deploy_action"></div>
	<h5>Deploy log:</h5>
	<pre id="deploy_log"></pre>
</article>

</div>
</body>
</html>