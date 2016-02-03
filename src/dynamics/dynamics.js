Scoped.define("module:Dynamic", [
   	    "module:Data.Scope",
   	    "module:Handlers.HandlerMixin",
   	    "base:Objs",
   	    "base:Strings",
   	    "base:Types",
   	    "base:Functions",
   	    "module:Registries",
   	    "jquery:"
   	], function (Scope, HandlerMixin, Objs, Strings, Types, Functions, Registries, $, scoped) {
	var Cls;
	Cls = Scope.extend({scoped: scoped}, [HandlerMixin, function (inherited) {
   		return {

		   	_notifications: {
				_activate: "__createActivate"
			},
				
			constructor: function (options) {
				this.initial = this.initial || {};
				options = Objs.extend(Objs.clone(this.initial, 1), options);
				this.domevents = Objs.extend(this.domevents, options.domevents);
				this.windowevents = Objs.extend(this.windowevents, options.windowevents);
				Objs.iter(this.cls.__initialForward, function (key) {
					if (!(key in this))
						return;
					if (key in options) {
						if (Types.is_object(this[key]) && Types.is_object(options[key]))
							options[key] = Objs.extend(Objs.clone(this[key], 1), options[key]);
					} else
						options[key] = this[key];
				}, this);
				Objs.iter(this.object_functions, function (key) {
					this[key] = function () {
						var args = Functions.getArguments(arguments);
						args.unshift(key);
						return this.execute.apply(this, args);
					};
				}, this);
				if (!options.parent && options.parentHandler) {
					var ph = options.parentHandler;
					while (ph && !options.parent) {
						options.parent = ph.instance_of(Cls) ? ph : null;
						ph = ph._parentHandler;
					}
				}
				inherited.constructor.call(this, options);
				if (options.tagName) {
					this._tagName = options.tagName;
					this.data("tagname", this._tagName);
				}
				this.functions = this.__functions;
				this._handlerInitialize(options);
				this.__createActivate = options.create || function () {};
				this.__registered_dom_events = [];
				this.dom_events = {};
				this.window_events = {};
			},
			
			handle_call_exception: function (name, args, e) {
				Registries.warning("Dynamics Exception in '" + this.cls.classname + "' calling method '" + name + "' : " + e);
				return null;
			},
			
			_afterActivate: function (activeElement) {
				this.activeElement().off("." + this.cid() + "-domevents");
				$(window).off("." + this.cid() + "-windowevents");
				var self = this;
				Objs.iter(this.domevents, function (target, event) {
					var ev = event.split(" ");
					var source = ev.length === 1 ? this.activeElement() : this.activeElement().find(ev[1]);
					this.__registered_dom_events.push(source);
					source.on(ev[0] + "." + this.cid() + "-domevents", function (eventData) {
						self.call(target, eventData);
					});
				}, this);
				Objs.iter(this.windowevents, function (target, event) {
					$(window).on(event + "." + this.cid() + "-windowevents", function (eventData) {
						self.call(target, eventData);
					});
				}, this);
			},
			
			destroy: function () {
				Objs.iter(this.__registered_dom_events, function (source) {
					source.off("." + this.cid() + "-domevents");
				}, this);
				$(window).off("." + this.cid() + "-windowevents");
				inherited.destroy.call(this);
			}
				
		};
	}], {
		
		__initialForward: [
		    "functions", "attrs", "extendables", "collections", "template", "create", "scopes", "bindings", "computed", "types"
        ],
		
		canonicName: function () {
			return Strings.last_after(this.classname, ".").toLowerCase();
		},
		
		registeredName: function () {
			return this.__registeredName || ("ba-" + this.canonicName());
		},
		
		findByElement: function (element) {
			return $(element).get(0).dynamicshandler;
		},
		
		register: function (key, registry) {
			registry = registry || Registries.handler;
			this.__registeredName = key || this.registeredName();
			registry.register(this.__registeredName, this);
			return this;
		},
		
		activate: function (options) {
			var dyn = new this(options || {element: document.body, name_registry: true});
			dyn.activate();
			return dyn;
		},
		
		attachStringTable: function (stringTable) {
			this.__stringTable = stringTable;
			return this;
		},
		
		addStrings: function (strings) {
			this.__stringTable.register(strings, this.registeredName());
			return this;
		},
		
		string: function (key) {
			var result = this.__stringTable.get(key, this.registeredName());
			if (!result && this.parent.string)
				result = this.parent.string(key);
			return result;
		},
		
		_extender: {
			attrs: function (base, overwrite) {
				return Objs.extend(Objs.clone(base, 1), overwrite);
			}
		}
	
	});
	return Cls;
});