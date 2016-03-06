Scoped.define("module:Registries", ["base:Classes.ClassRegistry", "jquery:"], function (ClassRegistry, $) {
	return {		
		
		handler: new ClassRegistry({}, true),
		partial: new ClassRegistry({}, true),
		prefixes: {"ba": true},
		
		templates: {

			cache: {},
			
			create: function (template) {
				template = template.trim();
				var cached = this.cache[template];
				if (cached)
					return cached.clone();
				var compiled;
				try {
					compiled = $(template);
				} catch (e) {
					compiled = $(document.createTextNode(template));
				}
				this.cache[template] = compiled;
				return compiled.clone();
			}
			
		},
		
		warning: function (s) {
			try {
				console.log(s);
			} catch (e) {}
		}
	
	};
});