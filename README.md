# betajs-dynamics 0.0.106
[![Build Status](https://api.travis-ci.org/betajs/betajs-dynamics.svg?branch=master)](https://travis-ci.org/betajs/betajs-dynamics)
[![Code Climate](https://codeclimate.com/github/betajs/betajs-dynamics/badges/gpa.svg)](https://codeclimate.com/github/betajs/betajs-dynamics)
[![NPM](https://img.shields.io/npm/v/betajs-dynamics.svg?style=flat)](https://www.npmjs.com/package/betajs-dynamics)
[![Gitter Chat](https://badges.gitter.im/betajs/betajs-dynamics.svg)](https://gitter.im/betajs/betajs-dynamics)

BetaJS-Dynamics is a dynamic DOM templating engine.



## Getting Started


You can use the library in the browser and compile it as well.

#### Browser

```javascript
	<script src="betajs/dist/betajs.min.js"></script>
	<script src="betajs-browser/dist/betajs-browser.min.js"></script>
	<script src="betajs-dynamics/dist/betajs-dynamics.min.js"></script>
``` 

#### Compile

```javascript
	git clone https://github.com/betajs/betajs-dynamics.git
	npm install
	grunt
```



## Basic Usage


The Javascript Controller:

```js

    dynamic = new BetaJS.Dynamics.Dynamic({
        element: document.querySelector("some_element"),
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



## Links
| Resource   | URL |
| :--------- | --: |
| Homepage   | [http://betajs.com](http://betajs.com) |
| Git        | [git://github.com/betajs/betajs-dynamics.git](git://github.com/betajs/betajs-dynamics.git) |
| Repository | [https://github.com/betajs/betajs-dynamics](https://github.com/betajs/betajs-dynamics) |
| Blog       | [http://blog.betajs.com](http://blog.betajs.com) | 
| Twitter    | [http://twitter.com/thebetajs](http://twitter.com/thebetajs) | 
| Gitter     | [https://gitter.im/betajs/betajs-dynamics](https://gitter.im/betajs/betajs-dynamics) | 



## Compatability
| Target | Versions |
| :----- | -------: |
| Firefox | 6 - Latest |
| Chrome | 18 - Latest |
| Safari | 4 - Latest |
| Opera | 12 - Latest |
| Internet Explorer | 8 - Latest |
| Edge | 12 - Latest |
| Yandex | Latest |
| iOS | 3.0 - Latest |
| Android | 2.2 - Latest |


## CDN
| Resource | URL |
| :----- | -------: |
| betajs-dynamics.js | [http://cdn.rawgit.com/betajs/betajs-dynamics/master/dist/betajs-dynamics.js](http://cdn.rawgit.com/betajs/betajs-dynamics/master/dist/betajs-dynamics.js) |
| betajs-dynamics.min.js | [http://cdn.rawgit.com/betajs/betajs-dynamics/master/dist/betajs-dynamics.min.js](http://cdn.rawgit.com/betajs/betajs-dynamics/master/dist/betajs-dynamics.min.js) |
| betajs-dynamics-noscoped.js | [http://cdn.rawgit.com/betajs/betajs-dynamics/master/dist/betajs-dynamics-noscoped.js](http://cdn.rawgit.com/betajs/betajs-dynamics/master/dist/betajs-dynamics-noscoped.js) |
| betajs-dynamics-noscoped.min.js | [http://cdn.rawgit.com/betajs/betajs-dynamics/master/dist/betajs-dynamics-noscoped.min.js](http://cdn.rawgit.com/betajs/betajs-dynamics/master/dist/betajs-dynamics-noscoped.min.js) |


## Unit Tests
| Resource | URL |
| :----- | -------: |
| Test Suite | [Run](http://rawgit.com/betajs/betajs-dynamics/master/tests/tests.html) |


## Dependencies
| Name | URL |
| :----- | -------: |
| betajs | [Open](https://github.com/betajs/betajs) |
| betajs-browser | [Open](https://github.com/betajs/betajs-browser) |


## Weak Dependencies
| Name | URL |
| :----- | -------: |
| betajs-scoped | [Open](https://github.com/betajs/betajs-scoped) |
| betajs-shims | [Open](https://github.com/betajs/betajs-shims) |


## Main Contributors

- Victor Lingenthal
- Oliver Friedmann

## License

Apache-2.0






## Sponsors

- Ziggeo
- Browserstack


