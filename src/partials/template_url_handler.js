
Scoped.define("module:Handlers.TemplateUrlPartial",
	["module:Handlers.Partial", "browser:Loader"], function (Partial, Loader, scoped) {

  /**
   * @name ba-template-url
   *
   * @description
   * Specify the template url for internal html.
   *
   * @param {string} templateUrl The template url.
   *
   * @example <div ba-template-url="my-template.html"></div>
   * // Evaluates to <div ...>CONTENTS OF MY-TEMPLATE.HTML</div>
   */
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {		
 		return {

			constructor: function (node, args, value) {
				inherited.constructor.apply(this, arguments);
				node._expandChildren = false;
				node._$element.html("");
				Loader.loadHtml(value, function (template) {
					node._$element.html(template);
					node._$element.children().each(function () {
	 					node._registerChild(this);
	 				});
				}, this);
			}

 		};
 	});
 	Cls.register("ba-template-url");
	return Cls;

});
