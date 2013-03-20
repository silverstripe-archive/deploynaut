<div class="redis-status">
	<% if RedisUnavailable %>
		<div class="text-error pull-right">Can't connect to redis: "$RedisUnavailable"</div>
	<% else_if RedisWorkersCount %>
		<div class="muted pull-right">$RedisWorkersCount workers connected</div>
	<% else %>
		<div class="text-error pull-right">No workers connected</div>
	<% end_if %>
</div>