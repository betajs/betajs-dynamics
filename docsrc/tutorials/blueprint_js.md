

```js

BetaJS.Dynamics.Dynamic.extend("BetaJS.Dynamics.Dynamictemplate", {

    //Only use one of the following three concurrently
    templateUrl : "templates/template.html",
    template : "<div>Internal Template {{some_attribute}}</div>",
    element : document.querySelector(".someclass"),


    bindings : {
        parent_dynamic_attribute: "<:attribute_in_parent_dynamic"
    },
    scope : {
        parent_dynamic: "<"
    },


    attrs : {
        some_attribute: true,
        computed_attribute : 'default value',
        dependency1 : 'Hel',
        dependency2 : 'lo'
        
    },
    collections : {
        some_collection: ['one','two']
    },

    computed : {
        'computed_attribute:dependency1,dependency2' : function () {
            return dependency1 + dependency2;
        }
    }

    create : {
        //Reading and writing attribute values
        var attribute = this.get('some_attribute');
        this.set('some_attribute',false);

        //Manipulating Collections
        this.get('some_collection').add('three');
        this.get('some_collection').remove('one');

        //Accessing other Dynamics
        var scope_attr = this.scope.parent_dynamic.get('attribute_in_parent_dynamic');
        var bind_attr = this.get('parent_dynamic_attribute');
        if (scope_attr == bind_attr)
            console.log('This is set up correctly');

        //Accessing functions
        this.call('some_function');
    },

    functions : {
        some_function : () {
            this.element() //to access the element itself
        }
    },

    _afterActivate : function (element) {
        console.log('This message is displayed after the dynamic is activated');
        //element passes you the element where the Dynamic is active on as a DOM element
    }

});


```
