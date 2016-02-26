The Javascript Controller:

```js

    dynamic = new BetaJS.Dynamics.Dynamic({
        element: $("some_element"),
        initial : {
            attrs : {
                some_attribute : "This is some Text",
                some_boolean : true
            }
        }
    });

```

The HTML Element:

```html

    <some_element ba-if="{{some_boolean}}">{{some_attribute}}</some_element>

```

Will evaluate to


```html

    <some_element>This is some Text</some_element>

```
