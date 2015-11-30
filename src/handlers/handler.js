Scoped.define("module:Handlers.HandlerMixin", [
    "base:Objs", "base:Strings", "base:Functions", "jquery:", "browser:Loader", "module:Handlers.Node", "module:Registries", "module:Handlers.HandlerNameRegistry"
], function (Objs, Strings, Functions, $, Loader, Node, Registries, HandlerNameRegistry) {
	return {		
		
		_notifications: {
			construct: "__handlerConstruct",
			destroy: "__handlerDestruct"
		},
		
		__handlerConstruct: function () {
			this._mesh_extend = {
				string: Functions.as_method(this.string, this)	
			};
		},
	
		__handlerDestruct: function () {
			Objs.iter(this.__rootNodes, function (node) {
				node.destroy();
			});
		},
		
		template: null,
		templateUrl: null,
		
		string: function (key) {
			if (this.cls.string)
				return this.cls.string(key);
			if (this.parent())
				return this.parent().string(key);
			return key;
		},
		
		_handlerInitialize: function (options) {
			options = options || {};
			if (options.name_registry)
				this.__nameRegistry = this.auto_destroy(new HandlerNameRegistry());
			this._parentHandler = options.parentHandler || null;
			this._argumentAttrs = {};
			var template = options.template || this.template;
			this.__element = options.element ? $(options.element) : null;
			this.initialContent = this.__element ? this.__element.html() : $(options.parentElement).html();
			this.__activeElement = this.__element ? this.__element : $(options.parentElement);
			if (template)
				this._handlerInitializeTemplate(template, options.parentElement);
			else {
				var templateUrl = options.templateUrl || this.templateUrl;
				if (templateUrl) {
					templateUrl = Strings.replaceAll(templateUrl, "%", Strings.last_after(this.cls.classname, ".").toLowerCase());
					this.__deferActivate = true;
					if (this.__element)
						this.__element.html("");
					else if (options.parentElement)
						$(options.parentElement).html("");
					Loader.loadHtml(templateUrl, function (template) {
						this.__deferActivate = false;
						this._handlerInitializeTemplate(template, options.parentElement);
						if (this.__deferedActivate)
							this.activate();
					}, this);
				} /*else
					this._handlerInitializeTemplate(template, options.parentElement);*/
			}
		},
		
		_handlerInitializeTemplate: function (template, parentElement) {
			var compiled = Registries.templates.create(template);
			if (this.__element) {
				this.__activeElement = this.__element;
				this.__element.html("");
				this.__element.append(compiled);
			} else if (parentElement) {
				this.__activeElement = $(parentElement);
				this.__element = compiled;
				this.__activeElement.html("");
				this.__activeElement.append(compiled);
			} else {
				this.__element = compiled;
				this.__activeElement = this.__element.parent();
			}
		},
		
		nameRegistry: function () {
			return this.__nameRegistry || (this.parent() ? this.parent().nameRegistry() : null);
		},
		
		byName: function (name) {
			return this.nameRegistry().get(name);
		},
		
		__assocs: {},
		
		addAssoc: function (name, registeredName) {
			this.__assocs[name] = registeredName;
		},
		
		removeAssoc: function (name) {
			delete this.__assocs[name];
		},
		
		assoc: function (name) {
			return this.byName(this.__assocs[name] || name);
		},
		
		setArgumentAttr: function (key, value) {
			this.properties().set(key, value);
			this._argumentAttrs[key] = true;
		},
		
		isArgumentAttr: function (key) {
			return !!this._argumentAttrs[key];
		},
		
		element: function () {
			return this.__element;
		},
		
		activate: function () {
			if (this.__deferActivate) {
				this.__deferedActivate = true;
				return;
			}		
			this._notify("_activate");
			this.__rootNodes = [];
			var self = this;			
			this.__element.each(function () {
				self.__rootNodes.push(new Node(self, null, this));
			});
			this._afterActivate(this.__activeElement);
		},
		
		_afterActivate: function (activeElement) {}
					
	};
});


Scoped.define("module:Handlers.Handler", [
   	    "base:Class",
   	    "module:Handlers.HandlerMixin",
   	    "base:Properties.Properties",
   	    "module:Registries"
   	], function (Class, HandlerMixin, Properties, Registries, scoped) {
   	return Class.extend({scoped: scoped}, [HandlerMixin, function (inherited) {
   		return {
			
			constructor: function (options) {
				inherited.constructor.call(this);
				options = options || {};
				this._properties = options.properties ? options.properties : new Properties();
				this.functions = {};
				this._handlerInitialize(options);
			},
			
			properties: function () {
				return this._properties;
			}
			
		};
   	}], {
			
		register: function (key, registry) {
			registry = registry || Registries.handler;
			registry.register(key, this);
		}
		
   	});
});


Scoped.define("module:Handlers.Partial", [
 	    "base:Class",
 	    "module:Parser",
 	    "module:Registries"
 	], function (Class, Parser, Registries, scoped) {
 	return Class.extend({scoped: scoped}, function (inherited) {
 		return {
			
			constructor: function (node, args, value, postfix) {
				inherited.constructor.call(this);
				this._node = node;
				this._args = args;
				this._value = value;
				this._active = false;
			},
			
			change: function (value, oldValue) {
				this._value = value;
				this._change(value, oldValue);
				this._apply(value, oldValue);
			},
			
			activate: function () {
				if (this._active)
					return;
				this._active = true;
				this._activate();
				this._apply(this._value, null);
			},
			
			deactivate: function () {
				if (!this._active)
					return;
				this._active = false;
				this._deactivate();
			},
			
			bindTagHandler: function (handler) {},
			
			unbindTagHandler: function (handler) {},
			
			_change: function (value, oldValue) {},
			
			_activate: function () {},
			
			_deactivate: function () {},
			
			_apply: function (value, oldValue) {},
			
			_execute: function (code) {
				var dyn = Parser.parseCode(code || this._value);
				this._node.__executeDyn(dyn);
			}
			
			
		};
 	}, {
		
		register: function (key, registry) {
			registry = registry || Registries.partial;
			registry.register(key, this);
		}
		
	});
});



Scoped.define("module:Handlers.HandlerNameRegistry", [
    "base:Class", "base:Objs"                                    
], function (Class, Objs, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {

			__handlers: {},
			
			destroy: function () {
				Objs.iter(this.__handlers, function (value, name) {
					this.unregister(name);
				}, this);
				inherited.destroy.call(this);
			},
			
			register: function (handler, name) {
				this.unregister(name);
				this.__handlers[name] = handler;
				handler.on("destroy", function () {
					this.unregister(name);
				}, this);
			},
			
			unregister: function (name) {
				if (name in this.__handlers) {
					var handler = this.__handlers[name];
					delete this.__handlers[name];
					if (!handler.destroyed())
						handler.off(null, null, this);
				}
			},
			
			get: function (name) {
				return this.__handlers[name];
			}
		
		};
			
	});
});
