<div class="help">
	<h4>Instructions to import a sspak file into your local site after downloading</h4>

	<p><strong>Note:</strong> Databases and assets snapshots are stored in deploynaut using the <a href="https://github.com/sminnee/sspak">sspak</a></a> format. 
	You will need to install sspak onto your local machine using the instructions on the module <a href="https://github.com/sminnee/sspak#installation">readme file</a> if you wish to work with these snapshots.</p>

	<p>If you want to restore database and assets from an existing sspak file you have downloaded from deploynaut, you can
	use one of the following methods:</p>

	<p>Import the sspak file into an existing local site:</p>

	<pre>sspak load /path/to/my/local/site /path/to/downloaded/file.sspak</pre>

	<p>Extract the sspak file contents, allowing you to import the database and assets manually:</p>

	<pre>sspak extract /path/to/downloaded/file.sspak</pre>

</div>
