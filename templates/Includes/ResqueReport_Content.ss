<div class="cms-content cms-tabset center $BaseCSSClasses" data-layout-type="border" data-pjax-fragment="Content">
	<div class="cms-content-header north">
		<div class="cms-content-header-info">
			<h2>
				<% include CMSSectionIcon %>
				<% if SectionTitle %>
				$SectionTitle
				<% else %>
				IDP adminstration
				<% end_if %>
			</h2>
		</div>
	</div>

	$Tools

	$EditForm

</div>
