<ul class="SelectionGroup<% if $extraClass %> $extraClass<% end_if %>">
	<% loop $FieldList %>
		<li<% if $Selected %> class="active"<% end_if %>>
			<a href="#deploy-tab-$Pos" data-value="$Value">$Title</a>
		</li>
	<% end_loop %>
</ul>

<div class="tab-content">
	<% loop $FieldList %>
		<div id="deploy-tab-$Pos" class="tab-pane<% if $Selected %> active<% end_if %> clearfix">
			$FieldHolder
		</div>
	<% end_loop %>
	<input name="SelectRelease" value="Branch" type="hidden" />
	$Form.Actions
</div>
