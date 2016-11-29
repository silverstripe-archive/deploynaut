const messages = [
	'Reticulating splines',
	'Calculating impulses',
	'Stacking the punchcards',
	'Adding hidden proxies',
	'Adjusting bell curves',
	'Aligning covariance matrices',
	'Asserting packed exemplars',
	'Attempting to lock buffer',
	'Building data trees',
	'Coalescing cloud formations',
	'Cohorting network',
	'Dicing models',
	'Extracting resources',
	'Integrating security',
	'Mixing workers',
	'Normalizing power',
	'Relaxing splines',
	'Retracting probes',
	'Scrubbing server',
	'Synthesizing AI',
];

export function getRandom() {
	return messages[Math.floor(Math.random()*messages.length)];
}
