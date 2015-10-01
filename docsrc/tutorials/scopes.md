
Scopes offer a way to directly access Attributes, Collections and Methods in other Dynamics.

You access other Dynamics by either directly addressing Parent or Children of certain dynamics.

Basic Usage Example:

```js

	BetaJS.Dynamics.Dynamic.extend("BetaJS.Dynamics.Childdynamic", {

		template : "<div>{{text}}</div>"

		initial : {

			attrs : {text: "Hello World!"}

			functions : {
				call_me : function () {
					alert("You wanted an alert?");
				}
			}

		}

	});


	BetaJS.Dynamics.Dynamic.extend("BetaJS.Dynamics.ScopeExample", {

		template : "<ba-childdynamic><ba-childdynamics>"

		initial : {

			scopes : {
				child_dynamic: ">[tagname='ba-childdynamic']",
			},

			create : {
				//Examples of Accessing another Dynamics
				var child_text = this.scopes.child_dynamic.get('text');
				// child_text will evaluate to "Hello World"

				this.scopes.child_dynamic.set('text','New Hello World Text');
				//The child dynamic evaluation will now be changed from
				//"<div>Hello World</div> to
				//"<div>New Hello World Text</div> to

				this.scopes.child_dynamic.call('call_me');
				// This will call the alert in the childdynamic (You wanted an alert?)

			},

	});


```

More Examples of valid Syntax

```js

	BetaJS.Dynamics.Dynamic.extend("BetaJS.Dynamics.ScopeExample", {

	dynamic = new BetaJS.Dynamics.Dynamic({

		initial : {

			scopes : {
				//This gives you the Dynamic
				parent_dynamic: "<",
				specific_child: ">[tagname='ba-tagname']",
				specific_in_all_children: ">+[tagname='ba-tagname']"

				//This gives you a query result of the Dynamics
				child_dynamics: ">",
				all_children: ">+",
				parents_children_dynamics: "<>",
				parents_childrens_children_dynamics: "<>>",
			},

			create : {

				//Examples of Accessing other Dynamics

				//Directly
				var scope_attr = this.scopes.parent_dynamic.get('attribute_in_parent_dynamic');
				// scope_attr is an attribute from the parent_dynamic

				//Query Collection
				var json_data = this.scopes.child_dynamics.get(0);
				// json_data is a JSON object that contains the attribute values from the first child_dynamic

			},

	});


```
