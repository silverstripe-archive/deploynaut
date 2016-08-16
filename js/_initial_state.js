module.exports = {

	messages: [
	],

	activeStep: 0,

	environment: "production",

	summary_of_changes: "",

	deployment: {
		enqueued: false
	},

	git: {
		selected_type: "",
		selected_ref: "",
		is_fetching: false,
		is_updating: false,
		last_updated: 0,
		list: []
	},

	approval: {

		bypassed: false,
		bypassed_time: "",

		rejected: false,
		rejected_time: "",

		request_by: {id: 5, email: "fredrik@example.com", role: "Team Member", name: "Fredrik Fredriksson"},
		request_sent: false,
		request_sent_time: "",

		approved: false,
		approved_time: "",

		approved_by: "",
		approvers: [
			{id: 1, email: "anders@example.com", role: "Release manager", name: "Anders Andersson"},
			{id: 2, email: "bengt@example.com", role: "Release manager", name: "Bengt Bengtsson"},
			{id: 3, email: "daniel@example.com", role: "Release manager", name: "Daniel Danielsson"},
			{id: 4, email: "erik@example.com", role: "Release manager", name: "Erik Eriksson"}
		]
	},

	plan: {
		is_loading: false,
		deployment_type: "",
		deployment_estimate: "",
		changes: {},
		validation_code: ""
	}
};
