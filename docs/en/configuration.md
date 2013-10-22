# Configurations

Most of the configurations takes place in the ´mysite/config/dnroot´, here is an explanation:

## Main config

	Injector:
	    DeploymentBackend:
	        class: CapistranoDeploymentBackend
	    DNData:
	        constructor:
	            0: "../../deploynaut-resources/envs"
	            1: "../../deploynaut-resources/gitkeys"

The `DeploymentBackend` will tell deploynaut which deployment backend. In the past we used 
another backend but the `CapistranoDeploymentBackend` is over preferred way of deploying.

The constructor arguments of `DNData` are the important directives of the configuration.

0. The first one tells deploynaut where to find the builds.
1. The second one tells deploynaut where to find the configuration for the projects 
   and environments.
2. The third one tells deploynaut where to find SSH keys to do a checkout.

## Graphite

	GraphiteDeploymentNotifier:
	    graphite_host: localhost
	    graphite_port: 2003
	GraphiteProxy:
	    graphite_source: "http://graphite.silverstripe.com:2080/render"

When this is setup, deploynaut will send a start / end deploy message to a graphite server.
