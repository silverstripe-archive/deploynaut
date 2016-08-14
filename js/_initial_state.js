module.exports = {

	activeStep: 0,

	environment: "production",
	deployment_type: "Code only",
	deployment_estimate: "2 min",

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

	changes: {
		"Code version": {
			from: "ddbc36e7ff8336810540cb03ac571651bb4c43ff",
			to: "ddbc36e7ff8336810540cb03ac571651bb4c43ff",
			compareUrl: "https://github.com/random/project/compare/ddbc36e7ff8336810540cb03ac571651bb4c43ff...ddbc36e7ff8336810540cb03ac571651bb4c43ff"
		},
		"Infrastructure version": {
			from: "3.6.4",
			to: "3.6.4"
		},
		"Base image": {
			from: "debian-jessie (ami-1234567)",
			to: "debian-jessie (ami-1234567)"
		},
		"Primary domain": {
			from: "www.example.com",
			to: "www.example.com"
		},
		"SSL certificate": {
			from: "bc:f1:84:38:a0:57...",
			to: "bc:f1:84:38:a0:57..."
		},
		".platform.yml other": {
			description: "",
			compareUrl: "https://github.com/random/project/compare/ddbc36e7ff8336810540cb03ac571651bb4c43ff...ddbc36e7ff8336810540cb03ac571651bb4c43ff"
		},
		"Other domains": {
			description: ""
		},
		Variables: {
			description: ""
		},
		"Virtual environments": {
			description: ""
		},
		Whitelist: {
			description: ""
		}
	}
};
