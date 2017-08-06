
Instead of using templates, you can also link a dynamic to an already existing html element which will then be evaluated by the dynamics system.

```js

	dynamic = new BetaJS.Dynamics.Dynamic({
		element : document.querySelector(".someclass")
	});

```
