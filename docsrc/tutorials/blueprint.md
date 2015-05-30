
This Blueprint is intented as a quick reference for how to integrate the most commonly
used Dynamic functionalities. On the specifics how they work please refer to the individual sections.

```js

	dynamic = new BetaJS.Dynamics.Dynamic({

		templateUrl : "templates/template.html", 		//This contains the relative file path to an external template
		template : "<div>Internal Template</div>",
		element : $(".someclass"),

		initial : {
			attrs : {},
			bind : {},
			scope : {},
			create : {

			},
			functions : {
				some_function : () {}
			}
		},

		_afterActivate : function (element) {
			console.log('This message is displayed after the dynamic is activated');
			//element passes you the element where the Dynamic is active on as a Jquery Object/Element
			element.find(".somechildnode");
		}

	});


```
