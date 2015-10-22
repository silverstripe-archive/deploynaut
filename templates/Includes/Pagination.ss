<% if $Pagination.MoreThanOnePage %>
    <nav>
        <ul class="pagination">
			<% if $Pagination.NotFirstPage %>
                <li>
                    <a href="$Pagination.PrevLink" aria-label="Previous">
                        <span aria-hidden="true">&laquo;</span>
                    </a>
                </li>
			<% end_if %>
			<% loop $Pagination.PaginationSummary %>
				<% if $CurrentBool %>
                    <li class="disabled"><a href="#">$PageNum</a></li>
				<% else %>
					<% if $Link %>
                        <li><a href="$Link">$PageNum</a></li>
					<% else %>
                        <li class="disabled"><a href="#">...</a></li>
					<% end_if %>
				<% end_if %>
			<% end_loop %>
			<% if $Pagination.NotLastPage %>
                <li>
                    <a href="$Pagination.NextLink" aria-label="Next">
                        <span aria-hidden="true">&raquo;</span>
                    </a>
                </li>
			<% end_if %>
        </ul>
    </nav>
<% end_if %>
