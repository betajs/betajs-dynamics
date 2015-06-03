
There are currently two ways to create Dynamics:
- As one Instance of a BetaJS Dynamic
- Create a new BetaJS Dynamics Class of which you can create multiple instances

#### Instances

```js

	dynamic = new BetaJS.Dynamics.Dynamic({
		templateUrl : "templates/template.html",
	});

	//This is only necessary if this dynamic is stand-alone
	//If the dynamic is the child of another dynamic it is not necessary
	dynamic.activate();

```

#### Classes

You can create new Dynamics classes using the code below:

```js

	BetaJS.Dynamics.Dynamic.extend("BetaJS.Dynamics.Classname", {

		templateUrl: "templates/classname.html",

	}).register("ba-htmltagname");

```

These classes can be instanciated in two ways,
either in the Javascript,

```js

	var new_instance = new BetaJS.Dynamics.Classname();
	new_instance.activate();

```

or in the DOM:

```html

	<ba-htmltagname></ba-htmltagname>

```

#### Conveniencemethods:

These Codesnippets are for rapid deployment and easy code-maintainment:

- templateUrl matching the classname

```js

	BetaJS.Dynamics.Dynamic.extend("BetaJS.Dynamics.Classname", {

		templateUrl: "templates/%.html",
		//The code above will evaluate equivalent to the code below
		templateUrl: "templates/classname.html",
		//You can do multiples of this: templates/%/%.html will evaluate to
		//templates/classname/classname.html

	}).register("ba-htmltagname");

```

- HTML Tag matching the classname

```js

	BetaJS.Dynamics.Dynamic.extend("BetaJS.Dynamics.Classname", {

		templateUrl: "templates/classname.html",

	}).register();
	//The code above will evaluate equivalent to the code below
	}).register("ba-classname");

```

You can combine this as in the example below:

 ```js

	BetaJS.Dynamics.Dynamic.extend("BetaJS.Dynamics.Classname", {

	templateUrl: "templates/%/%.html",

	}).register();

 ```