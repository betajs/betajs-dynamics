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
		},
		
		handlerCache: {
			
			cache: {},
			cacheDom: null,
			
			suspend: function (handler, element) {
				if (!this.cacheDom)
					this.cacheDom = $("<div ba-ignore style='display:none'></div>").appendTo(document.body);
				var cacheDom = this.cacheDom;
				var name = handler.data("tagname");
				this.cache[name] = this.cache[name] || [];
				this.cache[name].push({
					handler: handler,
					elements: element.children()
				});
				element.children().each(function () {
					cacheDom.append(this);
				});
			},
			
			resume: function (name, element, parentHandler) {
				if (!this.cache[name] || this.cache[name].length === 0)
					return null;
				var record = this.cache[name].shift();
				element.html(record.elements);
				record.handler._handlerInitialize({
					parentHandler: parentHandler,
					parentElement: element
				});
				return record.handler;
			} 
			
		}
	
	};
});