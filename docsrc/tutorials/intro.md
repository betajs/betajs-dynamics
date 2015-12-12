
## BetaJS Dynamics Overview

BetaJS Dynamics is a Javascript frontend framework to build the V and C in an MVC framework.
It has two parts:

*    "Dynamics" : a Javascript Controller
*    HTML Part : HTML Template/Element containing "pseudo code" so called Partials and Handlebars


## Example

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

## Decpendencies:

*   Jquery
*   BetaJS Scoped
*   BetaJS
