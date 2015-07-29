<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
	<% base_tag %>
    <title>Platform <% if Title %>/ $Title<% end_if %></title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">

	<% require themedCSS(style,deploynaut) %>
	<% require themedCSS(theme-style,platform) %>

	<% require javascript('deploynaut/thirdparty/select2/dist/js/select2.min.js') %>
    	<% require javascript("deploynaut/javascript/material.js") %>

    	<script src="//use.typekit.net/opf7opz.js"></script>
    	<script>try{Typekit.load();}catch(e){}</script>

    <meta name="author" content="SilverStripe LTD">
    <!-- Le HTML5 shim, for IE6-8 support of HTML5 elements -->
    <!--[if lt IE 9]>
	<script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->
</head>

<body>
<div class="page-container">
    <nav class="sidebar navbar-inverse">
		<% include Header %>
    </nav>

    <% if $CurrentUser %>
    <header class="header-navbar">
        <ul class="nav pull-right">
            <li><a href="Security/logout">Log out</a></li>
        </ul>
    </header>
    <% end_if %>

    <div class="main-container">
