Scoped.define("module:Partials.ReturnPartial", [
    "module:Handlers.Partial",
    "browser:Events"
], function(Partial, Events, scoped) {
    /**
     * @name ba-return
     *
     * @description
     * The ba-return partial allows the specification of custom behavior when the
     * `return` key is pressed.
     *
     * @param {expression} baReturn Expression to evaluate upon return key being
     * pressed. See ba-click for greater description as they are very similar.
     *
     * @example <input ba-return="processText()"></input>
     * // Calls parentDirective.processText() when return key is pressed within
     * the input field.
     */
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value) {
                inherited.constructor.apply(this, arguments);
                var events = this.auto_destroy(new Events());
                events.on(this._node._element, "keypress", function(e) {
                    if (e.which === 13)
                        this._execute();
                }, this);
            }

        };
    });
    Cls.register("ba-return");
    return Cls;
});