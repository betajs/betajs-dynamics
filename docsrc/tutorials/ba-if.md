

The ba-if Partial is used to automatically add or remove DOM Elements depending on the
boolean value of a given condition.


#### Example 1:

```html
<div ba-if="{{1 === 1}}"><h1>Hi</h1><div>
```

Will evaluate to

```html
<div><h1>Hi</h1><div>
```

And


```html
<div ba-if="{{1 === 2}}"><h1>Hi</h1><div>
```

Will evaluate to

```html
<div><div>
```

#### Example 2:

```html
<div class="some_class" ba-if="{{some_attribute}}">
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
<div>
```
