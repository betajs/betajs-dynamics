Scoped.define("module:Partials.GcPartial", ["module:Handlers.Partial"], function(Partial, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            bindTagHandler: function(handler) {
                if (this._value)
                    handler.enableGc(this._value);
            }

        };
    });
    Cls.register("ba-gc");
    return Cls;
});