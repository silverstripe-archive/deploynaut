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

    <meta name="author" content="SilverStripe LTD">
    <!-- Le HTML5 shim, for IE6-8 support of HTML5 elements -->
    <!--[if lt IE 9]>
	<script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->
</head>

<body>
<div class="page-container">
    <nav class="sidebar">
		<% include Header %>
    </nav>

    <header class="header-navbar">
		<% if $CurrentUser %>
            <ul class="nav pull-right">
                <li><a href="Security/logout">Log out</a></li>
            </ul>
		<% end_if %>
    </header>

    <div class="main-container">

        <div class="content">
            <div class="row">
                <div class="col-md-12">