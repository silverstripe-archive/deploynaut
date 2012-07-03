# Deploynaut

The deploynaut is a blend of a SS Website and [Capistrano](https://github.com/capistrano/capistrano/) recipies to manage deployment of SilverStripe sites. Capistrano has for a long time been a popular choice for exectuting shell commands on a remote server. 

## Capistrano Installation

Capistrano is written in ruby, and often deployed as a ruby gem. So the first requirement is to Installing it system wide (without supporting ri and docs) is done by:

	$ sudo gem install capistrano --no-ri --no-rdoc

Our implementation also relies on having multiple stages, such as dev, staging and live. This is supported by installing an extension to capistrano

	$ sudo gem install capistrano-ext --no-ri --no-rdoc


## Deploynaut installation

First get the base code for the project

	mkdir deploynaut.dev && cd deploynaut.dev
	git clone ssh://git@gitorious.silverstripe.com:2222/infrastructure/deploynaut.git www 

Now it's time to create folders and checkout dependent silverstripe modules

	cd www && phing