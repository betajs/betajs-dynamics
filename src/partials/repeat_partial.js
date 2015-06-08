Scoped.define("module:Partials.RepeatPartial", [
        "module:Partials.AbstractRepeatPartial",
        "base:Collections.Collection",
        "base:Collections.FilteredCollection",
        "base:Objs",
        "jquery:",
        "module:Parser",
        "base:Properties.Properties"
	], function (Partial, Collection, FilteredCollection, Objs, $, Parser, Properties, scoped) {
  /**
   * @name ba-repeat
   *
   * @description
   * Instantiate once for each instance in the collection. Render only the inner html
   * of the element for each instance.
   *
   * @param {object} instance Object representing a single element in the
   * collection. Updated as collection is iterated through.
   *
   * @param {object} collection Object representing multiple elements, each of
   * which will be instantiated.
   *
   * @example <ul ba-repeat-element="{{ i :: [1,2] }}"><li>{{i}}</li></ul>
   * // Evaluates to <ul><li>1</li><li>2</li></ul>
   */
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			_newItemElements: function () {
 				var elements;
 				var template = this._node._innerTemplate.trim();
 				try {
 					elements = $(template).appendTo(this._node._$element);
 				} catch (e) {
 					elements = $(document.createTextNode(template)).appendTo(this._node._$element);
 				}
 				return elements;
 			}
 		
 		};
 	});
 	Cls.register("ba-repeat");
	return Cls;
});
