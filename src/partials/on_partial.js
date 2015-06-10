
Scoped.define("module:Partials.EventPartial", ["module:Handlers.Partial"], function (Partial, scoped) {
  /**
   * @name ba-on
   *
   * @description
   * The ba-on partial executes the given expression when triggered by the
   * specified Dom event on the given Html element. For a complete list of Dom
   * events, see {@link http://www.w3schools.com/jsref/dom_obj_event.asp}
   *
   * @postfix {event} event The event triggering the expression is specified as
   * a post fix of the ba-on directive. See the examples.
   *
   * @param {expression} baOn Expression to evaluate upon the occurence of the
   * event. If within the scope of another directive, the expression can be an
   * exposed method of the parent directive (see ba-click documentation for
   * greater detail).
   *
   * @example <button ba-on:mouseover="alert('Hi')">Hi</button>
   * // Will alert('Hi') when the mouseover event occurs on the button.
   */
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			constructor: function (node, args, value, postfix) {
 				inherited.constructor.apply(this, arguments);
 				var self = this;
 				this.__postfix = postfix;
 				this._node._$element.on(postfix + "." + this.cid(), function () {
 					self._execute(value.trim());
 				});
 			},
 			
 			destroy: function () {
 				this._node._$element.off(this.__postfix + "." + this.cid());
 				inherited.destroy.call(this);
 			}
 		
 		};
 	});
 	Cls.register("ba-on");
	return Cls;
});
