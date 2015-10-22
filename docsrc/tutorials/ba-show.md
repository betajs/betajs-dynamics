

The ba-show Partial is used to automatically show or hide DOM Elements depending on the
boolean value of a given condition.

#### Note
Ba-if is really just a convenience method to show/hide DOM elements.

If ba-show evaluates to false it will apply the css property "display: none" to the DOM element it is placed on.
In comparison if ba-if evaluates to false it will also free all the resources of all underlying dynamics.

ba-if:
+ Less memory usage
- Potentially slower loading time

ba-show:
+ Faster loading time
- More memory


#### Example 1:

```html
<div ba-show="{{1 === 1}}"><h1>Hi</h1><div>
```

Will evaluate to

```html
<div><h1>Hi</h1><div>
```

And


```html
<div ba-show="{{1 === 2}}"><h1>Hi</h1><div>
```

Will evaluate to

```html
<div><h1 style='display: none'></h1><div>
```

#### Example 2:

```html
<div class="some_class" ba-show="{{some_attribute}}">
    <h1>Hi</h1>
<div>
```

```js
    some_dynamic = new BetaJS.Dynamics.Dynamic({
        element: $(".some_class"),
        initial:  {
            attrs : {
                some_attribute: true
            }
        }
    });
```

Will evaluate to

```html
<div class="some_class">
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
    <h1 style='display: none'>Hi</h1>
<div>
```
