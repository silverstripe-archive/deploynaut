<div class="help">
	<h4>Importing a snapshot into your local site</h4>

	<p><strong>Note:</strong> Databases and asset snapshots are stored using the <a href="https://github.com/silverstripe/sspak">sspak</a> format.
	You will need to install sspak using the following <a href="https://silverstripe.github.io/sspak">instructions</a> if you wish to work with these snapshots locally.</p>

	<p>If you want to restore database and assets from an existing sspak file you have downloaded from deploynaut, you can
	use one of the following methods:</p>

	<p>Import the sspak file into an existing local site:</p>

	<pre>sspak load /path/to/downloaded/file.sspak /path/to/my/local/site</pre>

	<p>Extract the sspak file contents, allowing you to import the database and assets manually:</p>

	<pre>sspak extract /path/to/downloaded/file.sspak</pre>
</div>
