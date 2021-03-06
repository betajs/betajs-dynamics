
You can create Dynamics both as instances and as classes which can be instantiated.
- As one Instance of a BetaJS Dynamic
- Create a new BetaJS Dynamics Class of which you can create multiple instances

#### Instance

```js

	var dynamic = new BetaJS.Dynamics.Dynamic({
		templateUrl : "templates/template.html",
		element: document.body
	});

	//This is only necessary if this dynamic is stand-alone
	//If the dynamic is the child of another dynamic it is not necessary
	dynamic.activate();

```

#### Class

You can create new dynamics classes using the code below:

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

or by just adding the DOM tagname :

```html

	<ba-htmltagname></ba-htmltagname>

```

#### Convenience Methods:

These code snippets can be quickly copy&pasted:

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