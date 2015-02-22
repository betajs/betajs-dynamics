Scoped.define("module:Registries", ["base:Classes.ClassRegistry"], function (ClassRegistry) {
	return {		
		
		handler: new ClassRegistry(),
		partial: new ClassRegistry()
	
	};
});
