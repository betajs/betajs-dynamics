Scoped.define("module:Partials.IfPartial", ["module:Partials.ShowPartial"], function(Partial, scoped) {
    /**
     * @name ba-if
     *
     * @description
     * The ba-if partial controls rendering of internal Html based on the truth
     * value of a given expression. It differs from ba-show in that ba-show
     * renders internal Html, but hides it, while ba-if will not render the
     * internal Html at all.
     *
     * @param {expression} baIf Expression to evaluate for truth. If true,
     * internal html will be rendered. If false, internal html will not be
     * rendered. Note, if the expression should be evaluted, it must be wrapped in
     * {{}}. See the examples below.
     *
     * @example <div ba-if="{{1 === 1}}"><h1>Hi</h1><div>
     * // Evaluated to <div><h1>Hi</h1></div>
     *
     * @example <div ba-if="{{1 === 2}}"></h1>Hi</h1></div>
     * // Evaluated to <div></div>
     */
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value) {
                inherited.constructor.apply(this, arguments);
                if (!value)
                    node.deactivate();
            },

            _apply: function(value) {
                inherited._apply.call(this, value);
                if (value)
                    this._node.activate();
                else
                    this._node.deactivate();
            }

        };
    });
    Cls.register("ba-if");
    return Cls;
});