The ba-click partial executes the code passed into it when the user clicks on the related DOM element. (or calls a function defined in the dynamic)


#### Example 1:

Will call an alert pop-up


```html
<div ba-click="alert('Hi')"><h1>Hi</h1><div>
```

#### Example 2:

Will Show/Hide the h1-element when you click on the surrounding div element.

```html
<div class="some_class" ba-click="boolean != boolean">
    <h1 ba-show="boolean">Hi</h1>
<div>
```

```js
    some_dynamic = new BetaJS.Dynamics.Dynamic({
        element: $(".some_class"),
        attrs : {
            boolean : true
        }
    });
```

#### Example 3:

Will also call an alert pop-up

```html
<div class="some_class" ba-click="some_function()">
    <h1>Hi</h1>
<div>
```

```js
    some_dynamic = new BetaJS.Dynamics.Dynamic({
        element: $(".some_class"),
        functions : {
            some_function : function () {
                alert('Another alert');
            }
        }
    });
```
