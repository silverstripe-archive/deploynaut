<% with $CurrentBranch %>
    <table class="table-striped table table-bordered">
        <thead>
        <tr>
            <th>Release</th>
            <th>Commit message</th>
            <th>Currently on</th>
            <th>Date created</th>
        </tr>
        </thead>
        <tbody>
			<% loop $DNBuildList %>
            <tr>
                <td>$FullName
					<% loop $References %>
                        <span class="label <% if $Type = 'Tag' %>label-info<% end_if %>" title="$Type">$Name</span>
					<% end_loop %>
                </td>
                <td title="$SubjectMessage $BodyMessage">$SubjectMessage</td>
                <td>
					<% loop $CurrentlyDeployedTo %>
                        <a href="{$Link}">$Title</a><% if not $Last %>,<% end_if %>
					<% end_loop %>
                </td>
                <td class="nowrap"><span class="tooltip-hint" data-toggle="tooltip" data-original-title="$Created.Nice ($Created.Ago)">$Created.Date</span></td>
            </tr>
			<% end_loop %>
        </tbody>
    </table>
<% end_with %>