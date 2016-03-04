Scoped.define("module:Partials.InnerTemplatePartial",
	["module:Handlers.Partial"], function (Partial, scoped) {

 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {		
 		return {

			constructor: function (node, args, value) {
				inherited.constructor.apply(this, arguments);
				node._$element.html(value);
			}

 		};
 	}, {
 		
 		meta: {
 			value_hidden: true
 		}
 		
 	});
 	Cls.register("ba-inner-template");
	return Cls;

});
