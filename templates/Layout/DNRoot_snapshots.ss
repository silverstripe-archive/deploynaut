<h2>$Project.Title</h2>

<% if $CurrentProject %>
<ul class="nav nav-tabs">
	<li<% if ProjectOverview %> class="active"<% end_if %>><a href="naut/project/$CurrentProject.Name">Deploy</a></li>
	<li<% if SnapshotsSection %> class="active"<% end_if %>><a href="naut/project/$CurrentProject.Name/snapshots">Snapshots</a></li>
</ul>
<ul class="nav level-2">
	<% if $Project.canBackup %>
	<li><a href="$CurrentProject.Link('createsnapshot')">Create Snapshot</a></li>
	<% end_if %>
	<!-- <li><a href="$CurrentProject.Link('uploadsnapshot')">Upload Files</a></li> -->
	<li><a href="$CurrentProject.Link('snapshotslog')">Log</a></li>
</ul>
<% end_if %>

<h3>$Title</h3>

<p>This is an archived list of all assets, databases or zip files containing both that you have access to view. Each item has links so you can download the files to your computer or restore the files to a chosen environment.</p>
<p>If you would like to create a new snapshot from an environment, click 'Create Snapshot', the Log displays a list of all snapshot transfers</p>
<!-- and if you would like to upload files from your computer to a new snapshot, click 'Upload' -->

<% include ArchiveList %>

<div class="help">

	<h4>Instructions to import a sspak file into your local site after downloading</h4>

	<p>Databases and assets snapshots are stored in deploynaut using the <a href="https://github.com/sminnee/sspak">sspak</a></a> format.</p>

	<p>You will need to install sspak onto your local machine if you wish to work with these snapshots.</p>

	<p>If you want to restore database and assets from an existing sspak file you have downloaded from deploynaut, you can
	use one of the following methods:</p>

	<p>Import the sspak file into an existing local site:</p>

	<pre>sspak load /path/to/my/local/site /path/to/downloaded/file.sspak</pre>

	<p>Extract the sspak file contents, allowing you to import the database and assets manually:</p>

	<pre>sspak extract /path/to/downloaded/file.sspak</pre>

</div>