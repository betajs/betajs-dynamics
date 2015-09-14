

The ba-click Partial executes the code it is passed into, or calls a function from the related Dynamic.


#### Example 1:

```html
<div ba-click="alert('Hi')"><h1>Hi</h1><div>
```

Will call an alert pop-up

TODO: Add Picture


#### Example 2:

```html
<div class="some_class" ba-click="some_function">
    <h1>Hi</h1>
<div>
```

```js
    some_dynamic = new BetaJS.Dynamics.Dynamic({
        element: $(".some_class"),
        initial:  {
            functions : {
                some_function : function () {
                    alert('Another alert');
                }
            }
        }
    });
```

Which will also call an alert pop-up
