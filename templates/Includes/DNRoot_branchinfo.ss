<p>Legend: 
	<span class="label label-info">release tag</span>
</p>
<table class="table-striped table table-bordered">
	<thead>
		<tr>
			<th>Release</th>
			<th>Commit message</th>
			<th>Currently on</th>
			<th>Date created</th>
			<% if Top.ReleaseSteps %>
			<th>Release Process</th>
			<% end_if %>
		</tr>
	</thead>
	<tbody>
	<% loop DNBuildList %>
		<tr>
			<td>$FullName
				<% loop $References %>
				<span class="label <% if $Type = Tag %>label-info<% end_if %>" title="$Type">$Name</span>
				<% end_loop %>
			</td>
			<td title="$SubjectMessage $BodyMessage">$SubjectMessage</td>
			<td>
				<% loop CurrentlyDeployedTo %>
				<a href="{$Link}">$Title</a><% if not $Last %>,<% end_if %>
				<% end_loop %>
			</td>
			<td class="nowrap"><span class="tooltip-hint" data-toggle="tooltip" data-original-title="$Created.Nice ($Created.Ago)">$Created.Date</span></td>
			<% if ReleaseSteps %>
			<td class="release-process nowrap">
				<% loop ReleaseSteps %>
				<% if $Status = "success" %>
				<a href="$Link" class="label label-success $FirstLast">$Name</a>
				<% else_if $Status = "failure" %>
				<a href="$Link" class="label label-important $FirstLast">$Name</a>
				<% else %>
				<a href="$Link" class="label $FirstLast">$Name</a>
				<% end_if %>
				<% end_loop %>
			</td>
			<% end_if %>
		</tr>
	<% end_loop %>
	</tbody>
</table>