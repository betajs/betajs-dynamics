
Scoped.define("module:Handlers.TemplateUrlPartial",
	["module:Handlers.Partial", "browser:Loader"], function (Partial, Loader, scoped) {

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
