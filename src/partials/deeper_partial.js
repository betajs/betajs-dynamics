Scoped.define("module:Partials.DeeperPartial", ["module:Handlers.Partial"], function(Partial, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            bindTagHandler: function(handler) {
                var splt = this._postfix.split(":");
                handler.registerInheritableAttribute(splt[0], splt[1], this._value, this._node);
            },

            unbindTagHandler: function(handler) {
                if (!handler)
                    return;
                var splt = this._postfix.split(":");
                handler.unregisterInheritableAttribute(splt[0], splt[1]);
            }

        };
    }, {

        manualExecute: true

    });
    Cls.register("ba-deeper");
    return Cls;
});