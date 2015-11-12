# Using the Dispatcher

This guide describes how to mount arbitrary React components into the existing Deploynaut templates.

To mount the component you will need to bring together three pieces: model, template mount point and React component.
If you extend your `Controller` from `Dispatcher`, this will give you some convenience functions to do so.

The three pieces are tied by name, we will use 'YourComponent' in the guide below. It's assumed all your scripts are
built centrally and already loaded.

CAVEAT: currently only one React component can be driven by a single Dispatcher - otherwise the state of security
tokens will diverge.

## Providing model

To provide the model for a named component, return in from the `getModel` function:

```php
namespace Foo;

class YourDispatcher extends \Dispatcher {

	public function getModel($name) {
		if ($name=='YourComponent') return [
			'MyListOfThings' => [1,2,3]
		];
	}
	...
```

## Choosing template mounting point

In the template, add the React mounting point.

```html
<div class="row">
	$getReactComponent(YourComponent)
</div>
```

## Installing the React component

To install the React component into the template structure, you can use the `Tools.install`:

```js
var Tools = require('../../deploynaut/js/tools.jsx');
var SomeForm = require('./SomeForm.jsx');
Tools.install(SomeForm, 'YourComponent');
```

## Further steps

Your React component will get initialised and rendered into the template. The model is then available in props.
Note that `form.jsx` requires some further scaffolding using the InitialSecurityID property, as included below.

```js
'use strict';

var form = require("../../deploynaut/js/form.jsx");

var StackCreator = React.createClass({

	getInitialState: function() {
		return {
			// Your custom data
			yourData: this.props.model.MyListOfThings
		};
	},

	render: function() {
		return (
			<form.Form
				securityID={this.props.model.InitialSecurityID}
				...
				/>
		);
	}
```
