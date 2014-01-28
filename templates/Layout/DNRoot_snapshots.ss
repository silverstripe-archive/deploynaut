<h2>$Project.Title</h2>

<h3>$Title</h3>

<p>This is an archived list of all assets, databases or zip files containing both that you have access to view. Each item has links so you can download the files to your computer or push the files to a chosen environment.</p>
<p>If you would like to create a new snapshot from an environment, click 'Create' and if you would like to upload 
files from your computer to a new snapshot, click 'Upload'</p>

<div class="button-nav">
	<ul class="nav nav-pills pull-right">
		<li><a href="$CurrentProject.Link('createsnapshot')">Create Snapshot</a></li>
		<!-- <li><a href="$CurrentProject.Link('uploadsnapshot')">Upload Files</a></li> -->
		<li><a href="$CurrentProject.Link('snapshotslog')">Log</a></li>
	</ul>
</div>

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