Scoped.define("module:Partials.DataPartial", ["module:Handlers.Partial"], function(Partial, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, {

        _apply: function(value) {
            this._node._tagHandler.data(this._postfix, value);
        },

        bindTagHandler: function(handler) {
            this._apply(this._value);
        }

    }, {

        meta: {
            requires_tag_handler: true
        }

    });
    Cls.register("ba-data");
    return Cls;
});