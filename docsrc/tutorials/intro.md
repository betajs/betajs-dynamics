
## BetaJS Dynamics Overview

BetaJS Dynamics is a JavaScript frontend framework. It generally has two parts:

*   _Dynamics_ : a JavaScript Controller interface
*   _HTML Templates_ : HTML Template / Element containing a fragment of JS, so called partials, handlebars and subdynamics


## Example

The Javascript Controller:

```js

    var dynamic = new BetaJS.Dynamics.Dynamic({
        element: $("some_element").html(),
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
<script type='text/template'>
    <some_element ba-if="{{some_boolean}}">{{some_attribute}}</some_element>
</script>
```

Will evaluate to


```html

    <some_element>This is some Text</some_element>

```