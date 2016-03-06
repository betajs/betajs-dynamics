The ba-tap partial is similar to the ba-click and is meant to be used with touchscreen interfaces for faster click response times.


#### Example 1:

Will call an alert pop-up


```html
<div ba-tap="alert('Hi')"><h1>Hi</h1><div>
```

#### Example 2:

Will toggle the heading element when you click on the surrounding div element.

```html
<div class="some_class" ba-tap="boolean != boolean">
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

Will call an alert pop-up

```html
<div class="some_class" ba-tap="some_function()">
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
