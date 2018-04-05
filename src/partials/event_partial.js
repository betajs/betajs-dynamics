Scoped.define("module:Partials.EventPartial", [
    "module:Handlers.Partial",
    "base:Functions"
], function(Partial, Functions, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, {

        bindTagHandler: function(handler) {
            var pf = this._postfix.trim();
            var fwd = pf.indexOf("~") === 0;
            if (fwd)
                pf = pf.substring(1);
            handler.on(pf, function() {
                if (fwd) {
                    var args = Functions.getArguments(arguments);
                    args.unshift(this._value || pf);
                    this._node._handler.trigger.apply(this._node._handler, args);
                } else
                    this._valueExecute(arguments);
            }, this);
        }

    }, {

        manualExecute: true

    });
    Cls.register("ba-event");
    return Cls;
});