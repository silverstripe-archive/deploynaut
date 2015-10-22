<div class="content page-header">
    <div class="row">
        <div class="col-md-12">
			<% include Breadcrumb %>
			<% include DeploymentTabs %>
			<% include ProjectLinks %>
        </div>
    </div>
</div>

<div class="content">

    <div class="row">
        <div class="col-md-12 environment-details">
            <a href="$CurrentEnvironment.Link"><i class="fa fa-long-arrow-left"></i> Pick another revision</a>
            <h4>Deployment plan</h4>
            $SummaryForm
        </div>
    </div>

</div>
