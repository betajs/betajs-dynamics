
Scoped.define("module:Partials.CachePartial", ["module:Handlers.Partial"], function (Partial, scoped) {
  	var Cls = Partial.extend({scoped: scoped},  {
  		
		bindTagHandler: function (handler) {
			handler.cacheable = true;
		},
		
		prepareTagHandler: function (createArguments) {
			createArguments.cacheable = true;
		}
	
 	}, {
 		
 		meta: {
 			requires_tag_handler: true
 		}
 		
 	});
 	Cls.register("ba-cache");
	return Cls;
});
