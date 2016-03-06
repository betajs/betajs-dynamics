
The ba-class partial dynamically sets the css class of a given element based on the boolean value of a given expression


#### Example

```html
<div class="some_class" ba-class="{{{
            "class_a" : true,
            "class_b" : 1===2,
            "class_c" : some_property
        }}}">
    <h1>Hi</h1>
<div>
```

```js
    some_dynamic = new BetaJS.Dynamics.Dynamic({
        element: $(".some_class"),
        attrs : {
            some_property : true
        }
    });
```
Evaluates to

```html
<div class="some_class class_a class_c"
    <h1>Hi</h1>
<div>
```