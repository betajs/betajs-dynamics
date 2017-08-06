

The ba-sharescope Partial share the scope between the parent dynamic and the child dynamic this is places on.

#### Example:

```js
    var parent_dynamic = new BetaJS.Dynamics.Dynamic({
        element: document.querySelector(".some_class"),
        initial:  {
            attrs : {
                some_attribute : "This is from the Parent Dynamic",
                property: new BetaJS.Properties.Properties({
                    another_attribute: "Parent"
                })
            }
        }
    });
    BetaJS.Dynamics.Dynamic.extend(null, {
        template: '<div class="child1">{{some_attribute}}</div><div class="child2">{{another_attribute}}</div>',
        initial:  {
            attrs : {
                some_attribute : "This is from the Child Dynamic",
                another_attribute : "Child"
            }
        }
    }).register('ba-child');
    parent_dynamic.activate();
```

```html
    <div class="some_class">
        <div class="parent1">{{some_attribute}}</div><div class="parent2">{{another_attribute}}</div>
        <ba-child ba-sharescope></ba-child>
        <ba-child ba-sharescope="{{property}}"></ba-child>
    </div>
```

will evaluate to

<div class="some_class">
    <div>This is from the Child Dynamic</div><div>Child</div>
    <div>This is from the Child Dynamic</div><div>Child</div>
    <div>This is from the Child Dynamic</div><div>Child</div>
</div>