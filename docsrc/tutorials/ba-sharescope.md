

The ba-sharescope Partial share the scope between the parent dynamic and the child dynamic this is places on.

#### Example:

```js

            BetaJS.Dynamics.Dynamic.extend(null, {
                template: '<input value="{{=testvar}}" /><p>{{testvar}}</p>',
                initial : {
                    attrs: {
                        testvar: "Test"
                    }
                }
            }).register("ba-innerfullbind");

            var main = new BetaJS.Dynamics.Dynamic({
                element: $("test"),
                attrs: {
                    testvar: "Foobar",
                    props: new BetaJS.Properties.Properties({
                    	testvar: "Coolbar"
                    })
                }
            });
            main.activate();


    var parent_dynamic = new BetaJS.Dynamics.Dynamic({
        element: $(".some_class"),
        initial:  {
            attrs : {
                some_attribute : "This is from the Parent Dynamic
            }
        }
    });
    var child_dynamic = new BetaJS.Dynamics.Dynamic({
        template: '<div></div>',
        initial:  {
            attrs : {
                some_attribute : "This is from the Child Dynamic
                another_attribute : "This is from the Child Dynamic
            }
        }
    }).register('ba-child');
    parent_dynamic.activate()
```

```html

    <input value="{{=testvar}}" /><p>{{testvar}}</p>
    <ba-innerfullbind ba-sharescope>
    </ba-innerfullbind>
    <ba-innerfullbind ba-sharescope="{{props}}">
    </ba-innerfullbind>


    <div class="some_class">
        <ba-child ba-sharescope></ba-child>
    </div>
```