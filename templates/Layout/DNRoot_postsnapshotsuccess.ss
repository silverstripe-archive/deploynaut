<div class="content page-header">
	<div class="row">
		<div class="col-md-9">
			<% include Breadcrumb %>
			<% if $CurrentProject %>
				<ul class="nav nav-tabs">
					<li><a href="$CurrentProject.Link('snapshots')">Overview</a></li>

					<% if $CurrentProject.canBackup %>
						<li><a href="$CurrentProject.Link('createsnapshot')">Create snapshot</a></li>
					<% end_if %>
					<% if $CurrentProject.canUploadArchive %>
						<li><a href="$CurrentProject.Link('uploadsnapshot')">Upload snapshot</a></li>
					<% end_if %>
					<li><a href="$CurrentProject.Link('snapshotslog')">Log</a></li>
				</ul>
			<% end_if %>
		</div>
	</div>
</div>

<div class="content">

	<h3>Thanks for your request</h3>
	<p>We are now waiting for you to send us your snapshot.</p>

	<ul>
		<li>Create an *.sspak file containing your database and/or assets</li>
		<li>Label the file with: <pre>{$PlatformTitle}-$DataArchive.UploadToken</pre></li>
		<li>Make the file available to SilverStripe in some way, for example by:
			<ul>
				<li>burning and sending a DVD by post to the address below</li>
				<li>
					uploading to a third-party file sharing service<br>
					<b>Warning!</b> Make sure data sovereignty regulations are respected. Using an overseas service may breach confidentiality.
				</li>
			</ul>
		</li>
		<li>Notify SilverStripe about the location of the file.</li>
	</ul>

	<p>
		For postal submissions please use the following address:
		<pre>$Address</pre>
	</p>

	<p>We will contact you once the file has been processed.</p>

	<% include SnapshotCreateInstructions %>

	<p><a href="$BackURL">Back to your project</a></p>
</div>
