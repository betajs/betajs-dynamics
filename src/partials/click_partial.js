Scoped.define("module:Partials.ClickPartial", [
    "module:Handlers.Partial",
    "browser:Events"
], function(Partial, Events, scoped) {
    /**
     * @name ba-click
     *
     * @description
     * The ba-click partial allows the specification of custom on clicked
     * behavior. By default, the click propagation is prevented. Should you want
     * the click to propagate, use the `onclick` Html tag.
     *
     * @param {expression} baClick Expression to evaluate upon click. If click is
     * within the scope of another directive, the Expression can be an exposed method of
     * the parent directive.
     *
     * @example <button ba-click="showing = !showing">
     * // Expression is evaluated (ex. showing now equals inverse) on click.
     *
     * @example <button ba-click="exposedMethod()">
     * // Calls parentDirective.call("exposedMethod") on click.
     *
     * @example <button ba-click="exposedMethod(arg)">
     * // Calls parentDirective.call("exposedMethod", arg) on click.
     */
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value) {
                inherited.constructor.apply(this, arguments);
                var events = this.auto_destroy(new Events());
                events.on(this._node.element(), "click", function(e) {
                    e.stopPropagation();
                    this._execute();
                }, this);
            }

        };
    }, {

        manualExecute: true

    });
    Cls.register("ba-click");
    return Cls;
});