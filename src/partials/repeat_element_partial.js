Scoped.define("module:Partials.RepeatElementPartial", [
        "module:Partials.AbstractRepeatPartial",
        "base:Collections.Collection",
        "base:Collections.FilteredCollection",
        "base:Objs",
        "jquery:",
        "module:Parser",
        "base:Properties.Properties"
	], function (Partial, Collection, FilteredCollection, Objs, $, Parser, Properties, scoped) {
  /**
   * @name ba-repeat-element
   *
   * @description
   * Instantiate entire Html element (both element and the html is closes)
   * once for each instance in the collection.
   * Differs from ba-repeat, in that while ba-repeat instantiates just the
   * inner Html contents of the given element for each instance in the
   * collection, ba-repeat-element instantiates the Html element and the inner
   * Html contents. See examples.
   * 
   * @param {object} instance Object representing a single element in the
   * collection. Updated as collection is iterated through.
   *
   * @param {object} collection Object representing multiple elements, each of
   * which will be instantiated.
   *
   * @example <p ba-repeat-element="{{ i :: [1,2,3] }}">{{i}}</p>
   * // Evalues to <p>1</p><p>2</p><p>3</p>
   */
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			constructor: function (node, args, value) {
 				inherited.constructor.apply(this, arguments);
 				this.__filteredTemplate = $(node._template).removeAttr("ba-repeat-element").get(0).outerHTML;
 			},
 			
 			_activate: function () {
 				this._node._$element.hide();
 				inherited._activate.call(this);
 			},
 			
 			_newItemElements: function () {
 				var template = this.__filteredTemplate.trim();
				var element = $(template).get(0);
				this._node._$element.after(element);
 				element["ba-handled"] = true;
 				return $(element);
 			}

 		};
 	});
 	Cls.register("ba-repeat-element");
	return Cls;
});
