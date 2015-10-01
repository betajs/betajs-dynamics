
## BetaJS Dynamics Overview

BetaJS Dynamics is a Javascript frontend framework to build the V and C in an MVC framework.
It has two parts:

*    "Dynamics" : a Javascript Controller
*    HTML Part : HTML Template/Element containing "pseudo code" so called Partials and Handlebars


## Hello World Example

The Javascript Controller:

```js

    dynamic = new BetaJS.Dynamics.Dynamic({
        element: $("some_element"),
        initial : {
            attrs : {
                some_attribute : "Hello World",
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

    <some_element>Hello World</some_element>

```

## Decpendencies:

*   Jquery
*   BetaJS Scoped
*   BetaJS

## Core Concepts


## Dynamic


## Partials

Partials are a form of pseudocode to that allow you to write often used functions
directly into the view.

```html

    <div ba-if="">Hello</div>

```

## Content

### General

*   blueprint Javascript
*   blueprint HMTL

### Dynamics

#### Template

*   Template
*   TemplateUrl
*   Element

#### Initial

*   Attributes
*   Collections
*   Scope
*   Bind
*   functions

#### Loading Functions

*   create
*   _afterActivate

### Partials

#### Dynamic

*   ba-attrs
*   ba-repeat
*   ba-share

#### View

*   ba-class
*   ba-if
*   ba-show

#### User Interaction

*   ba-click
*   ba-on
*   ba-return
*   ba-tap

#### Misc

*   ba-ignore
*   ba-template-url