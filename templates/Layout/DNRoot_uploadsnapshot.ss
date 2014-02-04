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
	<!-- <li class="active"><a href="$CurrentProject.Link('uploadsnapshot')">Upload Files</a></li> -->
	<li><a href="$CurrentProject.Link('snapshotslog')">Log</a></li>
</ul>
<% end_if %>

<h3>$Title</h3>

<p>Either choose a local file to transfer to deploynaut or the option to post a DVD of your files and have the CWP team upload them for you</p>

<div class="upload-form">
	<div id="UploadFile" class="field file">
		<label class="left">Choose a file</label>
		<div class="middleColumn">
			<input type="file" name="UploadFile" id="UploadFile" />
		</div>	
	</div>

	<p class="text-center"><strong>OR</strong></p>

	<p id="Checkbox1" class="field checkbox upload-dvd">
        <input type="checkbox" id="Checkbox1" name="Checkbox1" value="1" checked="" />
        <label class="right" for="Checkbox1">Post by DVD</label>
	</p>

	<div id="Action" class="field dropdown">
		<label class="left">Upload DVD to</label>
		<div class="middleColumn">
			<select name="Action" class="dropdown" id="Form_Action">

				<option value="deploynaut">Deploynaut</option>
				<option value="env1">Environment 1</option>
				<option value="env2">Environment 2</option>
				<option value="env3">Environment 3</option>

			</select>
		</div>	
	</div>

	<div class="Actions">
		<a href="post.html" class="btn">Submit</a>
	</div>
</div>

<div class="help">

	<h4>Instructions to create a sspak file</h4>

	<p>Databases and assets snapshots are stored in deploynaut using the <a href="https://github.com/sminnee/sspak">sspak</a></a> format.</p>

	<p>You will need to install sspak onto your local machine if you wish to work with these snapshots.</p>

	<p>If you want to upload database and assets from your local environment to a deploynaut environment, you will need to
	create an sspak file using one of the following ways:</p>

	<p>Create an sspak file from your existing local site:</p>

	<pre>sspak save /path/to/my/local/site mysite.sspak</pre>

	<p>Create an sspak file from existing SQL database and assets. Does not require an existing site:</p>
	<pre>sspak saveexisting mysite.sspak --db=/path/to/database/dump.sql --assets=/path/to/assets</pre>

	<p>You can then upload the output the newly created sspak file to deploynaut and use it to restore the database and assets onto an
	environment.</p>

</div>