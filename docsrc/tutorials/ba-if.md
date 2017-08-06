
The ba-if partial is used to automatically display or hide DOM Elements depending on the boolean value of a given condition.

#### Note

If ba-if evaluates to false it will free all the resources of all underlying dynamics. In comparison ba-show does not do this.


ba-if:
- (+) Less memory usage
- (-) Potentially slower loading time

ba-show:
- (+) Faster loading time
- (-) More memory


#### Example 1:

```html
<div ba-if="{{1 === 1}}"><h1>Hi</h1><div>
```

Will evaluate to

```html
<div><h1 style="display:block;">Hi</h1><div>
```

And


```html
<div ba-if="{{1 === 2}}"><h1>Hi</h1><div>
```

Will evaluate to

```html
<div><h1 style="display:none;">Hi</h1><div>
```

#### Example 2:

```html
<div class="some_class" ba-if="{{some_attribute}}">
    <h1>Hi</h1>
<div>
```

```js
    some_dynamic = new BetaJS.Dynamics.Dynamic({
        element: document.querySelector(".some_class"),
        attrs : {
            some_attribute: true
        }
    });
```

Will evaluate to

```html
<div class="some_class" style="display:block;">
    <h1>Hi</h1>
<div>
```

Now if we call

```js
    some_dynamic.set("some_attribute",false);
```

The View will be changed to

```html
<div class="some_class">
<div>
```
