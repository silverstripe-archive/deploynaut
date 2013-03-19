<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
	<% base_tag %>
    <title>Deploynaut</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">
	<% require themedCSS(bootstrap) %>
    <meta name="author" content="SilverStripe LTD">
	 <!-- Le HTML5 shim, for IE6-8 support of HTML5 elements -->
    <!--[if lt IE 9]>
      <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->
	<style>
      body {
        padding-top: 60px; /* 60px to make the container go all the way to the bottom of the topbar */
      }
    </style>
	</head>

 <body>
    <div class="navbar navbar-fixed-top">
      <div class="navbar-inner">
        <div class="container">
          <a class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse">
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </a>
          <a class="brand" href="{$Link}projects">deploynaut</a>
          <div class="nav-collapse">
            <ul class="nav">
				<li><a href="{$Link}projects">projects</a></li>
            </ul>
          </div><!--/.nav-collapse -->
        </div>
      </div>
    </div>

    <div class="container">
      <article id="content" class="span12">
		  <div>Deploying <em>$Sha</em> to <em>$Project:$Environment</em></div>
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
	</article>
    </div> <!-- /container -->

  </body>
</html>
