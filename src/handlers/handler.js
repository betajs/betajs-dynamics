Scoped.define("module:Handlers.HandlerMixin", [
    "base:Objs",
    "base:Strings",
    "base:Functions",
	"base:Types",
    "jquery:",
    "browser:Loader",
    "module:Handlers.Node",
    "module:Registries",
    "module:Handlers.HandlerNameRegistry",
    "browser:DomMutation.NodeRemoveObserver"
], function (Objs, Strings, Functions, Types, $, Loader, Node, Registries, HandlerNameRegistry, NodeRemoveObserver) {
	return {		
		
		_notifications: {
			construct: "__handlerConstruct",
			destroy: "__handlerDestruct"
		},
		
		__handlerConstruct: function () {
			this.__activated = false;
			this._mesh_extend = {
				string: Functions.as_method(this.string, this)	
			};
		},
	
		__handlerDestruct: function () {
			Objs.iter(this.__rootNodes, function (node) {
				var $element = node.$element();
				node.destroy();
				if (this.remove_on_destroy)
					$element.html("");
			}, this);
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
		
		remove_on_destroy: false,
		
		_handlerInitialize: function (options) {
			options = options || {};
			if (options.name_registry)
				this.__nameRegistry = this.auto_destroy(new HandlerNameRegistry());
			this.__types = options.types || {};
			this._parentHandler = options.parentHandler || null;
			this._parentElement = options.parentElement;
			this._argumentAttrs = {};
			this.template = options.template || this.template;
			this.templateUrl = options.templateUrl || this.templateUrl;
			if (this.templateUrl)
				this.templateUrl = Strings.replaceAll(this.templateUrl, "%", Strings.last_after(this.cls.classname, ".").toLowerCase());
			this.__element = options.element ? $(options.element) : null;
			this.initialContent = this.__element ? this.__element.html() : $(this._parentElement).html();
			this.__activeElement = this.__element ? this.__element : $(this._parentElement);
			if (options.remove_observe) {
				this.__removeObserver = this.auto_destroy(NodeRemoveObserver.create(this.__activeElement.get(0)));
				this.__removeObserver.on("node-removed", function () {
					this.weakDestroy();
				}, this);
			}
			this.__activeElement.get(0).dynamicshandler = this;
			
			/*
			if (this.template)
				this._handlerInitializeTemplate(this.template, this._parentElement);
			else {
				if (this.templateUrl) {
					this.__deferActivate = true;
					if (this.__element)
						this.__element.html("");
					else if (this._parentElement)
						$(this._parentElement).html("");
					Loader.loadHtml(this.templateUrl, function (template) {
						this.__deferActivate = false;
						this._handlerInitializeTemplate(template, this._parentElement);
						if (this.__deferedActivate)
							this.activate();
					}, this);
				}
			}
			*/
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
			if (key in this.__extendables) 
				value = Objs.tree_extend(this.properties().get(key) || {}, value);
			if (this.__types[key])
				value = Types.parseType(value, this.__types[key]);
			this.properties().set(key, value);
			this._argumentAttrs[key] = true;
		},
		
		isArgumentAttr: function (key) {
			return !!this._argumentAttrs[key];
		},
		
		element: function () {
			return this.__element;
		},
		
		activeElement: function () {
			return this.__activeElement;
		},
		
		_updateActiveElement: function (activeElement) {
			this.__activeElement = activeElement;
			if (this.__removeObserver) {
				this.__removeObserver.weakDestroy();
				this.__removeObserver = this.auto_destroy(NodeRemoveObserver.create(this.__activeElement.get(0)));
				this.__removeObserver.on("node-removed", function () {
					this.weakDestroy();
				}, this);				
			}
		},
		
		activate: function () {
			if (this.__activated)
				return;
			this.__activated = true;
			/*
			if (this.__deferActivate) {
				this.__deferedActivate = true;
				return;
			}
			*/
			if (this.template)
				this._handlerInitializeTemplate(this.template, this._parentElement);
			else {
				if (this.templateUrl) {
					this.__activated = false;
					Loader.loadHtml(this.templateUrl, function (template) {
						this.templateUrl = null;
						this.template = template;
						this.activate();
					}, this);
					return;
				}
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
 	    "base:JavaScript",
 	    "base:Functions",
 	    "module:Parser",
 	    "module:Registries"
 	], function (Class, JavaScript, Functions, Parser, Registries, scoped) {
 	return Class.extend({scoped: scoped}, function (inherited) {
 		return {
			
			constructor: function (node, args, value, postfix) {
				inherited.constructor.call(this);
				this._node = node;
				this._args = args;
				this._value = value;
				this._active = false;
				this._postfix = postfix;
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
			
			prepareTagHandler: function (createArguments) {},
			
			_change: function (value, oldValue) {},
			
			_activate: function () {},
			
			_deactivate: function () {},
			
			_apply: function (value, oldValue) {},
			
			_execute: function (code) {
				var dyn = Parser.parseCode(code || this._value);
				this._node.__executeDyn(dyn);
			},
			
			_valueExecute: function (args) {
				var value = this._value.trim();
				if (JavaScript.isProperIdentifier(value)) {
					args = Functions.getArguments(args);
					args.unshift(value);
					this._node._handler.execute.apply(this._node._handler, args);
				} else
					this._execute(value);			
			}
			
			
		};
 	}, {
		
 		meta: {
 			// value_hidden: false
 			// requires_tag_handler: false
 		},
 		
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
