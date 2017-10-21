Scoped.define("module:Partials.ClassPartial", [
    "module:Handlers.Partial",
    "browser:Dom"
], function(Partial, Dom, scoped) {
    /**
     * @name ba-class
     *
     * @description
     * Dynamically set the HTML class of the given element based on the evaluation
     * of expressions.
     *
     * @param {object} baClass Object where keys are Html classes and values are
     * expressions. If the expression evaluates to true, the class is included on
     * the Html element. If the expression evaluates to false, the class is not
     * included.
     *
     * @example <div ba-class="{{{'first': true, 'second': 1 === 2}}}></div>"
     * // Evaluates to <div class="first"></div>
     */
    var Cls = Partial.extend({
        scoped: scoped
    }, {

        _apply: function(value) {
            for (var key in value) {
                var hasClass = Dom.elementHasClass(this._node.element(), key);
                var newHasClass = !!value[key];
                if (newHasClass === hasClass)
                    return;
                if (newHasClass)
                    Dom.elementAddClass(this._node.element(), key);
                else
                    Dom.elementRemoveClass(this._node.element(), key);
            }
        }

    });
    Cls.register("ba-class");
    return Cls;
});