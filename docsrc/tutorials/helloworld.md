Our "Hello World" a one-page html that loads the BetaJS framework and some other required files in the head. And runs a very basic "Hello World" script in the body.

If everything is set up correctly you should see "Hello World" if you load the helloworld.html displayed in the box below in the your browser, and making sure that all the assets are present as well.

```html

	<!DOCTYPE html>
	<html>
	<head lang="en">
		<meta charset="UTF-8">
		<title>Hello World</title>
		<script src="vendors/jquery.min.js"></script>
		<script src="vendors/beta.js"></script>
		<script src="vendors/betajs-browser-noscoped.js"></script>
		<script src="vendors/betajs-dynamics.js"></script>
	</head>
	<body>

		<div id="helloworld">{{replaced_value}}</div>

		<script>

			var dynamic = new BetaJS.Dynamics.Dynamic({
				element: $("#helloworld")
			});

			dynamic.set("replaced_value", "Hello World");
			dynamic.activate();

		</script>

	</body>
	</html>

```

#### Now lets go briefly through the individual parts:


```html

	<div id="helloworld"> {{replaced_value}} </div>

```

Inside {{}} ist an attribute property that we can control from other parts of the application.

```js

	dynamic = new BetaJS.Dynamics.Dynamic({
		element: $("#helloworld")
	});

```

Here, we are creating a new dynamic, and make it responsible for handling the subtree under the dom node ``#helloworld``.


```js

	dynamic.set("replaced_value", "Hello World");

```

Here, we create set an attribute "replaced_value" and give it the value "Hello World". When the dynamic is loaded, the handlebars {{replaced_value}} will be replaced by its value in the DOM so that we see "Hello World" on the actual site.

Dynamic attributes are a key value store based on the BetaJS Properties class.

The HTML view will update itself automatically when attributes in the dynamic are changed.


```js

	dynamic.activate();

```

This last part activates the dynamic and binds the HTML to the JS controller.