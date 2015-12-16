Scoped.define("module:Partials.TemplatePartial",
	["module:Handlers.Partial"], function (Partial, scoped) {

 	var Cls = Partial.extend({scoped: scoped}, {		

		bindTagHandler: function (handler) {
			if (this._value)
				handler.template = this._value;
		}
		
 	}, {
 		
 		meta: {
 			requires_tag_handler: true,
 			value_hidden: true
 		}
 		
 	});
 	Cls.register("ba-template");
	return Cls;

});
