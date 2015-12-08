Scoped.define("module:Dynamic", [
   	    "module:Data.Scope",
   	    "module:Handlers.HandlerMixin",
   	    "base:Objs",
   	    "base:Strings",
   	    "module:Registries",
   	    "jquery:"
   	], function (Scope, HandlerMixin, Objs, Strings, Registries, $, scoped) {
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
					if (!(key in options) && (key in this))
						options[key] = this[key];
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
			},
			
			handle_call_exception: function (name, args, e) {
				console.log("Dynamics Exception in '" + this.cls.classname + "' calling method '" + name + "' : " + e);
				return null;
			},
			
			domevents: {},
			windowevents: {},
			
			_afterActivate: function (activeElement) {
				this.activeElement().off("." + this.cid() + "-domevents");
				$(window).off("." + this.cid() + "-windowevents");
				var self = this;
				Objs.iter(this.domevents, function (target, event) {
					var ev = event.split(" ");
					var source = ev.length === 1 ? this.activeElement() : this.activeElement().find(ev[1]);
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
				this.activeElement().off("." + this.cid() + "-domevents");
				$(window).off("." + this.cid() + "-windowevents");
				inherited.destroy.call(this);
			}
				
		};
	}], {
		
		__initialForward: [
		    "functions", "attrs", "extendables", "collections", "template", "create", "bind", "scopes"
        ],
		
		canonicName: function () {
			return Strings.last_after(this.classname, ".").toLowerCase();
		},
		
		registeredName: function () {
			return this.__registeredName || ("ba-" + this.canonicName());
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
			return this.__stringTable.get(key, this.registeredName());
		}
	
	});
	return Cls;
});