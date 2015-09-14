
## Partials

Partials are a way to integrate and/or connect the Controller (C of the MVC layout) with the View.
They are placed onto HTML DOM elements/nodes and are evaluated by BetaJS-Dynamic Javascript functions who
manipulate the related DOM elements/nodes and thus changing the View (V of the MVC).

The Partials will only work if they are within the Scope of an active Dynamic

#### General layout:

```html
<div ba-partialname="related attributes/code"><div>
```

#### Example 1 - ba-if:

The ba-if Partial is used to automatically add or remove DOM Elements depending on the
boolean value of a given condition.

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

## Overview of Partials:

### User Interaction:

- ba-click
- ba-tap
- ba-return

### Changing the View

- ba-class
- ba-if
- ba-show

### Others

- ba-repeat
- ba-on
- ba-template-url
- ba-ignore