<h3>Deploying to $Project:$Environment</h3>
<div>Deploying <em>$Sha</em></div>
<form id="deploydata">
	<input type="hidden" name="environment" id="environment" value="$Environment" >
	<input type="hidden" name="sha" id="sha" value="$Sha" >
	<input type="hidden" name="logfile" id="logfile" value="$LogFile" >
	<input type="hidden" name="project" id="project" value="$Project" >
</form>

<h5>Status:</h5>
<pre id="deploy_action"></pre>
<h5>Deploy log:</h5>
<pre id="deploy_log" data-logfile="$LogFile"></pre>