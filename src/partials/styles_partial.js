Scoped.define("module:Partials.StylesPartial", ["module:Handlers.Partial", "base:Objs"], function(Partial, Objs, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, {

        _apply: function(value) {
            var s = this._node._element.style;
            Objs.iter(this.__previousValue, function(v, k) {
                if (!(k in value))
                    s.removeProperty(k);
            });
            Objs.extend(s, value);
            this.__previousValue = Objs.clone(value, 1);
        }

    });
    Cls.register("ba-styles");
    return Cls;
});