
### Introduction

The ba-repeat partial repeats the containing DOM elements of the DOM Elements it is placed a certain number of times.

##### Example 1:

```html
<ul ba-repeat="{{ i :: [1,2] }}">
    <li>{{i}}</li>
</ul>
```

Evaluates to

```html
<ul>
    <li>1</li>
    <li>2</li>
</ul>
```

##### Example 2:

```js
    dynamic = new BetaJS.Dynamics.Dynamic({
        element: $(".some_class"),
        initial:  {
            collections : {
                named_collection: [
                    {item_name : "Apple", item_index : "1"},
                    {item_name : "Orange", item_index : "2"},
                ]
            }
        }
    });
```

```html
    <div class="some_class" ba-repeat="{{ item ::  named_collection}}">
        <div>
            <span>{{item.item_name}}</span>
            <span>{{item.item_index}}</span>
        </div>
    </div>
```

Evaluates to

```html
<div>
    <div>
        <span>Apple</span>
        <span>1</span>
    </div>
    <div>
        <span>Orange</span>
        <span>2</span>
    </div>
</div>
```

### Advanced

#### Filters

Filters are a way of defining rules to limit the number of items shown by the ba-repeat Partial.

##### Example 1:

```html
<ul ba-repeat="{{ i ~ i == 2 :: [1,2] }}">
    <li>{{i}}</li>
</ul>
```

Evaluates to

```html
<ul>
    <li>2</li>
</ul>
```

##### Example 2:

```js
    dynamic = new BetaJS.Dynamics.Dynamic({
        element: $(".some_class"),
        initial:  {
            collections : {
                named_collection: [
                    {item_name : "Apple", item_index : "1"},
                    {item_name : "Orange", item_index : "2"},
                ]
            }
        }
    });
```

```html
    <div class="some_class" ba-repeat="{{ item ~ item.item_index == 1 ::  named_collection}}">
        <div>
            <span>{{item.item_name}}</span>
            <span>{{item.item_index}}</span>
        </div>
    </div>

Evaluates to

```html
<div>
    <div>
        <span>Apple</span>
        <span>1</span>
    </div>
</div>
```

### ba-repeat-element

ba-repeat-element is a special form of ba-repeat, it repeats the element it is placed on itself.
The ba-repeat is the preferred partial due to performance.

##### Example :

```html
<ul>
    <li ba-repeat="{{ i :: [1,2] }}">{{i}}</li>
</ul>
```

Evaluates to

```html
<ul>
    <li>1</li>
    <li>2</li>
</ul>
```