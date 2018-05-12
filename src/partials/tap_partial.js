Scoped.define("module:Partials.TapPartial", [
    "module:Handlers.Partial",
    "browser:Info",
    "browser:Events",
    "base:Time",
    "base:Async"
], function(Partial, Info, Events, Time, Async, scoped) {
    /**
     * @name ba-tap
     *
     * @description
     * The ba-tap partial allows the specification of custom on tap behavior. Tap
     * is particularly useful for handling mobile events.
     *
     * @param {expression} baTap Expression to evaluate upon tap. See ba-click
     * documentation for more details as they are very similar.
     *
     * @example <button ba-tap="someMethod()">Tap</button>
     * // Calls parentDirective.call("someMethod") on tap.
     */
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value, postfix) {
                inherited.constructor.apply(this, arguments);
                var events = this.auto_destroy(new Events());
                if (!Info.isMobile()) {
                    events.on(this._node._element, "click", function(e) {
                        e.stopPropagation();
                        this._execute();
                    }, this);
                    return;
                }
                /*
                    This code prevents two issues with tapping on mobile devices
                        - after touchstart, click is being fired and might execute subsequent things
                            workaround: if delta between last tap and click is too small, discard
                        - sometimes click is fired but not touchstart
                            workaround: if delta between last tap and click is sufficiently large, execute
                 */
                var touch = postfix ? "touch" + postfix.trim() : "touchstart";
                var lastTap = 0;
                events.on(this._node._element, "click " + touch, function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    var delta = Time.now() - lastTap;
                    if (delta < 100)
                        return;
                    Async.eventually(function() {
                        this._execute();
                    }, this);
                    lastTap = Time.now();
                }, this);
            }

        };
    }, {

        manualExecute: true

    });
    Cls.register("ba-tap");
    return Cls;
});