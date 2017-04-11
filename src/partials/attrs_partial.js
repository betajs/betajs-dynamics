Scoped.define("module:Partials.AttrsPartial", [
    "module:Handlers.Partial",
    "base:Objs",
    "base:Class"
], function(Partial, Objs, Class, scoped) {
    /**
     * @name ba-attrs
     *
     * @description
     * The ba-attrs partial allows the specification of an object that will
     * provide attributes accessible within the element containing the ba-attrs
     * html attribute.
     *
     * @param {object} baAttrs Object containing individual attributes.
     *
     * @example <div ba-attrs="{{{test: 'hi'}}}">{{test}}</div>
     * // Evaluates to <div ba-attrs="{{{test: 'hi'}}}">hi</div>
     */
    var Cls = Partial.extend({
        scoped: scoped
    }, {

        _apply: function(value) {
            if (!this._active)
                return;
            var props = this._node._tagHandler ? this._node._tagHandler.properties() : this._node.properties();
            for (var key in value)
                props.set(key, value[key]);
        },

        bindTagHandler: function(handler) {
            for (var key in this._value)
                handler.setArgumentAttr(key, Class.is_pure_json(this._value[key]) ? Objs.clone(this._value[key], 1) : this._value[key]);
        }

    });
    Cls.register("ba-attrs");
    return Cls;
});