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
          <a class="brand" href="naut/projects">deploynaut</a>
            <ul class="nav">
				<li><a href="naut/projects">projects</a></li>
            </ul>
        </div>
      </div>
    </div>

    <div class="container">
      $Layout
    </div> <!-- /container -->

  </body>
</html>
