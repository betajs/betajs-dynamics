Scoped.define("module:Partials.IgnorePartial", ["module:Handlers.Partial"], function(Partial, scoped) {
    /**
     * @name ba-ignore
     *
     * @description
     * The ba-ignore partial instructs the BetaJS Dynamics process to not process
     * anything of the inner Html within the given element implementing the
     * ba-ignore partial. The ba-ignore partial is often used to stop the
     * processing of an inline script tag.
     *
     * @example <div ba-attrs="{{{test: 'hi'}}}"><p ba-ignore>{{test}}</p></div>
     * // Renders <div ...><p ba-ignore>{{test}}</p></div>
     */
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value) {
                inherited.constructor.apply(this, arguments);
                node.deactivate();
            }

        };
    });
    Cls.register("ba-ignore");
    return Cls;
});