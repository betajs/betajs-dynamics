Scoped.define("module:Partials.NoScopePartial", ["module:Handlers.Partial"], function(Partial, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            prepareTagHandler: function(createArguments) {
                createArguments.properties = this._node.properties();
            }

        };
    });
    Cls.register("ba-noscope");
    return Cls;
});