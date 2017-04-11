Scoped.define("module:Partials.ShowPartial", ["module:Handlers.Partial"], function(Partial, scoped) {
    /**
     * @name ba-show
     *
     * @description
     * The ba-show partials controls showing the internal Html on the Dom based on
     * the truth value of the given expression.
     *
     * @param {expression} baShow Expression to evaluate for truth. If true,
     * internal html will be displayed. If false, internal html will not be
     * displayed. Expression must be wrapped in {{}} so it will be evaluated, as
     * seen below.
     *
     * @example <p ba-show="{{1 === 1}}">Hi</p>
     * // Evalues to <p>Hi</p>
     * @example <p ba-show="{{1 === 2}}">Hi</p>
     * // Evalues to <p style="display: none;">Hi</p>
     */
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value) {
                inherited.constructor.apply(this, arguments);
                this.__oldDisplay = undefined;
                this.__readOldDisplay = false;
                this.__hidden = false;
                if (!value)
                    this.__hide();
            },

            __hide: function() {
                if (this.__hidden)
                    return;
                this.__hidden = true;
                if (!this.__readOldDisplay) {
                    this.__oldDisplay = this._node._element.style.display;
                    this.__readOldDisplay = true;
                }
                this._node._element.style.display = "none";
            },

            __show: function() {
                if (!this.__hidden)
                    return;
                this.__hidden = false;
                this._node._element.style.display = this.__oldDisplay && this.__oldDisplay !== 'none' ? this.__oldDisplay : "";
            },

            _apply: function(value) {
                if (value)
                    this.__show();
                else
                    this.__hide();
            }

        };
    });
    Cls.register("ba-show");
    return Cls;
});