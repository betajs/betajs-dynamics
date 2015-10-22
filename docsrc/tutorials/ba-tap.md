

The ba-tap partial is similar to the ba-click and is meant to be used with touchscreen interfaces,
it executes the code passed into it, or calls a function from the related Dynamic when the user taps on the screen.

#### Note

In particular this partial is useful when the ba-click experiences a delay on touchscreen surfaces.


#### Example 1:

Will call an alert pop-up


```html
<div ba-tap="alert('Hi')"><h1>Hi</h1><div>
```

#### Example 2:

Will Show/Hide the "<h1>Hi</h1>"  element when you click on the surrounding div element.

```html
<div class="some_class" ba-tap="boolean != boolean">
    <h1 ba-show="boolean">Hi</h1>
<div>
```

```js
    some_dynamic = new BetaJS.Dynamics.Dynamic({
        element: $(".some_class"),
        initial:  {
            attrs : {
                boolean : true
            }
        }
    });
```

#### Example 3:

Will also call an alert pop-up

```html
<div class="some_class" ba-tap="some_function()">
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
