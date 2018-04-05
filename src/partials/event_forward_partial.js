Scoped.define("module:Partials.EventForwardPartial", [
    "module:Handlers.Partial",
    "base:Functions"
], function(Partial, Functions, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, {

        bindTagHandler: function(handler) {
            handler.on("all", function() {
                var eventName = arguments[0];
                var args = Functions.getArguments(arguments, 1);
                var result = [eventName];
                var pf = this._postfix.trim();
                if (pf.indexOf("~") === 0) {
                    console.log(pf, arguments);
                }
                if (pf) {
                    if (pf.indexOf("~") === 0) {
                        pf = pf.substring(1);
                        if (eventName.indexOf(pf) === 0)
                            result = [eventName.substring(pf.length + 1)];
                    } else
                        result = [pf + "-" + eventName];
                }
                if (this._value)
                    result = result.concat(this._value);
                result = result.concat(args);
                this._node._handler.trigger.apply(this._node._handler, result);
            }, this, {
                off_on_destroyed: true
            });
        },

        unbindTagHandler: function(handler) {
            if (handler)
                handler.off(null, null, this);
        }

    });
    Cls.register("ba-event-forward");
    return Cls;
});