
There are currently two ways to link dynamic code to a template:
- Internal Templates defined inside the Javascript Code
- External Templates defined in an external file

They are mutually exclusive.

```js

	dynamic = new BetaJS.Dynamics.Dynamic({
		templateUrl : "templates/template.html", 		//This contains the relative file path to an external template
		template : "<div>Internal Template</div>"
	});

```
