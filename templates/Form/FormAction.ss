<button class="btn <% if $Form.DefaultAction.Name = $Name %>btn-primary<% end_if %>" $AttributesHTML>
	<% if $ButtonContent %>$ButtonContent<% else %>$Title.XML<% end_if %>
</button>
