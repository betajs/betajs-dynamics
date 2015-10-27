

The ba-attrs Partial allows you to set initial property values for a dynamic from within its DOM scope.

#### Example:


```html
	<div class="some_class" ba-attrs="{{{foobar: 'xyz'}}}">
		<ba-innertest ba-attrs="{{{tester: 'abc'}}}">
		</ba-innertest>
	</div>
	<testouter>{{foobar}}</testouter><testinner>{{tester}}</testinner>
```

```js
	BetaJS.Dynamics.Dynamic.extend(null, {
		template: '<outer>{{foobar}}</outer><inner>{{tester}}</inner>',
	}).register("ba-innertest");

    var dynamic = new BetaJS.Dynamics.Dynamic({
        element: $('.some_class')
    });
    dynamic.activate();
```


Will evaluate to

```html
	<div class="some_class">
        <outer>abc</outer><inner></inner>
	</div>
	<testouter></testouter><testinner>xyz</testinner>
```