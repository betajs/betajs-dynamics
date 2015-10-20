Scoped.define("module:Registries", ["base:Classes.ClassRegistry"], function (ClassRegistry) {
	return {		
		
		handler: new ClassRegistry({}, true),
		partial: new ClassRegistry({}, true),
		prefixes: {"ba": true}
	
	};
});
