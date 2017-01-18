# Configurations

Most of the configurations takes place in the ´mysite/config/dnroot´, here is an explanation:

## Main config

	Injector:
	  DeploymentBackend:
	    class: CapistranoDeploymentBackend
	    properties:
	      PackageGenerator: %$DefaultPackageGenerator
	  DefaultPackageGenerator:
	    class: SimplePackageGenerator
	    properties:
	      BuildScript: "composer install --prefer-dist --no-dev --no-progress"
	  DNData:
	    constructor:
	      0: "../../deploynaut-resources/envs"
	      1: "../../deploynaut-resources/gitkeys"
	      2: "assets/transfers"

The `DeploymentBackend` will tell deploynaut which deployment backend. In the past we used 
another backend but the `CapistranoDeploymentBackend` is our preferred way of deploying.

The constructor arguments of `DNData` are the important directives of the configuration.

1. The first one tells deploynaut where to find the configuration for the projects 
   and environments.
2. The second one tells deploynaut where to find SSH keys to do a checkout.
3. The third one tells deploynaut where to store data transfers (backups of db and/or asset files)

## Multiple backends

If you want to have multiple backends, use the Injector to configure them, and then specify the list of backends on DNEnvironment.allowed_backends:

	Injector:
	  DeploymentBackend:
	    class: CapistranoDeploymentBackend
	    properties:
	      PackageGenerator: %$DefaultPackageGenerator
	  DefaultPackageGenerator:
	    class: SimplePackageGenerator
	    properties:
	      BuildScript: "composer install --prefer-dist --no-dev --no-progress"
	      Cache: %$PackageCache
	  PackageCache:
	    class: SizeRestrictedPackageCache
	    properties: 
	      BaseDir: "../deploynaut-resources/build-cache"
	      CacheSize: 5
	  AWSBackend:
	    class: AWSBackendDeploymentBackend
	DNEnvironment:
	  allowed_backends:
	    DeploymentBackend: "Default"
	    AWSBackend: "AWS"
