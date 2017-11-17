Scoped.define("module:Partials.HotkeyPartial", [
    "module:Handlers.Partial",
    "browser:Events",
    "browser:Hotkeys"
], function(Partial, Events, Hotkeys, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value) {
                inherited.constructor.apply(this, arguments);
                var events = this.auto_destroy(new Events());
                var hotkey = this._postfix;
                events.on(this._node._element, "keydown", function(e) {
                    if (Hotkeys.handleKeyEvent(hotkey, e))
                        this._execute();
                }, this);
            }

        };
    });
    Cls.register("ba-hotkey");
    return Cls;
});