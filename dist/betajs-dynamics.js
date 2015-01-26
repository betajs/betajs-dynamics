/*!
betajs-dynamics - v0.0.1 - 2015-01-25
Copyright (c) Oliver Friedmann,Victor Lingenthal
MIT Software License.
*/
BetaJS.Dynamics = BetaJS.Dynamics || {};

BetaJS.Dynamics.Parser = {
	
	parseText: function (text) {
		if (!text)
			return null;
		var chunks = [];
		while (text) {
			var i = text.indexOf("{{");
			var dynamic = null;
			if (i === 0) {
				i = text.indexOf("}}");
				while (i + 2 < text.length && text.charAt(i+2) == "}")
					i++;
				if (i >= 0) {
					i += 2;
					dynamic = this.parseCode(text.substring(2, i - 2));
				} else
					i = text.length;
			} else if (i < 0)
				i = text.length;
			chunks.push(dynamic ? dynamic : text.substring(0, i));
			text = text.substring(i);
		}
		if (chunks.length == 1)
			return BetaJS.Types.is_string(chunks[0]) ? null : chunks[0];
		var dependencies = {};
		BetaJS.Objs.iter(chunks, function (chunk) {
			if (!BetaJS.Types.is_string(chunk)) {
				BetaJS.Objs.iter(chunk.dependencies, function (dep) {
					dependencies[dep] = true;
				});
			}
		});
		return {
			func: function (obj) {
				var s = null;
				BetaJS.Objs.iter(chunks, function (chunk) {
					var result = BetaJS.Types.is_string(chunk) ? chunk : chunk.func(obj);
					s = s === null ? result : (s + result);
				});
				return s;
			},
			dependencies: BetaJS.Objs.keys(dependencies)
		};
	},
	
	executeCode: function (code, list) {
		if (BetaJS.Types.is_string(code))
			return code;
		var data = {};
		var has = function (scope, key) {
			var keys = key ? key.split(".") : [];
			for (var i = 0; i < keys.length; ++i) {
		       if (!scope || !BetaJS.Types.is_object(scope))
		    	   return false;
		       if (BetaJS.Properties.Properties.is_instance_of(scope))
		    	   scope = scope.data();
		       scope = scope[keys[i]];
		    }
			return BetaJS.Types.is_defined(scope);
		};
		var read = function (scope, key) {
			var keys = key ? key.split(".") : [];
			for (var i = 0; i < keys.length; ++i) {
		       if (!scope || !BetaJS.Types.is_object(scope))
		    	   return null;
		       if (BetaJS.Properties.Properties.is_instance_of(scope))
		    	   scope = scope.data();
		       scope = scope[keys[i]];
		    }
	       if (BetaJS.Properties.Properties.is_instance_of(scope))
	    	   scope = scope.data();
			return scope;
		};
		var write = function (scope, key, value) {
			if (!key)
				return;
			var keys = key.split(".");
			for (var i = 0; i < keys.length - 1; ++i) {
		       if (BetaJS.Properties.Properties.is_instance_of(scope)) {		    	   
		    	   scope.set(keys.splice(i).join("."), value);
		    	   return;
		       }
			   if (!(keys[i] in scope) || !BetaJS.Types.is_object(scope[keys[i]]))
					scope[keys[i]] = {};
		       scope = scope[keys[i]];
		    }
	        if (BetaJS.Properties.Properties.is_instance_of(scope))
	    	    scope.set(keys[keys.length - 1], value);
	        else
	        	scope[keys[keys.length - 1]] = value;
		};
		BetaJS.Objs.iter(code.dependencies, function (dep) {
			for (var i = list.length - 1; i >= 0; --i) {
				if (has(list[i], dep)) {
					write(data, dep, read(list[i], dep));
					break;
				}
			}
			dep = (dep.split("."))[0];
			if (!(dep in data) && !(dep in window))
				write(data, dep, null);
		});
		var result = code.func(data);
		BetaJS.Objs.iter(code.dependencies, function (dep) {
			for (var i = list.length - 1; i >= 0; --i) {
				if (i === 0 || has(list[i], dep)) {
					write(list[i], dep, read(data, dep));
					break;
				}
			}
		});
		return result;
	},
	
	parseCode: function (code) {
		var bidirectional = false;
		if (code.charAt(0) == "=") {
			bidirectional = true;
			code = code.substring(1);
		}
		var i = code.indexOf("::");
		var args = null;
		if (i >= 0) {
			args = code.substring(0, i).trim();
			code = code.substring(i + 2);
		}
		return {
			bidirectional: bidirectional,
			args: args,
			variable: bidirectional ? code : null,
			func: new Function ("obj", "with (obj) { return " + code + "; }"),
			dependencies: BetaJS.JavaScript.extractIdentifiers(code, true)
		};
	}
		
};
BetaJS.Class.extend("BetaJS.Scopes.Scope", [
	BetaJS.Events.EventsMixin,
	BetaJS.Events.ListenMixin,
	BetaJS.Classes.ObjectIdMixin, {
		
	constructor: function (options) {
		options = BetaJS.Objs.extend({
			functions: {},
			data: {},
			parent: null,
			scopes: {},
			bind: {},
			attrs: {},
			collections: {}
		}, options);
		var parent = options.parent;
		this.__manager = parent ? parent.__manager : this._auto_destroy(new BetaJS.Scopes.ScopeManager(this));
		this._inherited(BetaJS.Scopes.Scope, "constructor");
		this.__parent = parent;
		this.__root = parent ? parent.root() : this;
		this.__children = {};
		this.__properties = new BetaJS.Properties.Properties();
		this.__properties.on("change", function (key, value, oldValue) {
			this.trigger("change:" + key, value, oldValue);
		}, this);
		this.__functions = options.functions;
		this.__scopes = {};
		this.__data = options.data;
		this.setAll(options.attrs);
		BetaJS.Objs.iter(options.collections, function (value, key) {
			this.set(key, new BetaJS.Collections.Collection(value));
		}, this);
		if (parent)
			parent.__add(this);
		this.scopes = BetaJS.Objs.map(options.scopes, function (key) {
			return this.scope(key);
		}, this);
		BetaJS.Objs.iter(options.bind, function (value, key) {
			var i = value.indexOf(":");
			this.bind(this.scope(value.substring(0, i)), key, {secondKey: value.substring(i + 1)});
		}, this);
	},
	
	destroy: function () {
		BetaJS.Objs.iter(this.__scopes, function (scope) {
			scope.destroy();
		});
		BetaJS.Objs.iter(this.__children, function (child) {
			child.destroy();
		});
		this.__properties.destroy();
		if (this.__parent)
			this.__parent.__remove(this);
		this.trigger("destroy");
		this._inherited(BetaJS.Scopes.Scope, "destroy");
	},
	
	__object_id_scope: function () {
		return this.__manager;
	},
	
	__add: function (child) {
		this.__children[child.cid()] = child;
		this.trigger("add", child);
	},
	
	__remove: function (child) {
		this.trigger("remove", child);
		delete this.__children[child.cid()];
	},
	
	data: function (key, value) {
		if (arguments.length === 0)
			return this.__data;
		if (arguments.length === 1)
			return this.__data[key];
		this.__data[key] = value;
		this.trigger("data", key, value);
		return this;
	},
	
	set: function (key, value) {
		this.__properties.set(key, value);
		return this;
	},
	
	setAll: function (obj) {
		this.__properties.setAll(obj);
		return this;
	},
	
	get: function (key) {
		return this.__properties.get(key);
	},
	
	define: function (name, func, ctx) {
		this.__functions[name] = BetaJS.Functions.as_method(func, ctx || this);
		return this;
	},
	
	call: function (name) {
		return this.__functions[name].apply(this, BetaJS.Functions.getArguments(arguments, 1));		
	},
	
	parent: function () {
		return this.__parent;
	},
	
	root: function () {
		return this.__root;
	},
	
	children: function () {
		return this.scope(">");
	},
	
	properties: function () {
		return this.__properties;
	},
	
	scope: function (base, query) {
		if (arguments.length < 2) {
			query = base;
			base = this;
		}
		if (!query)
			return base;
		if (base && base.instance_of(BetaJS.Scopes.MultiScope))
			base = base.iterator().next();
		if (!base)
			return base;
		var ident = BetaJS.Ids.objectId(base) + "_" + query;
		if (!this.__scopes[ident])
			this.__scopes[ident] = new BetaJS.Scopes.MultiScope(this, base, query);
		return this.__scopes[ident];
	},
	
	bind: function (scope, key, options) {
		if (scope.instance_of(BetaJS.Scopes.MultiScope)) {
			var iter = scope.iterator();
			while (iter.hasNext())
				this.properties().bind(key, iter.next().properties(), options);
			scope.on("addscope", function (s) {
				this.properties().bind(key, s.properties(), options);
			}, this);
			scope.on("removescope", function (s) {
				this.properties().unbind(key, s.properties());
			}, this);
		} else
			this.properties().bind(key, scope.properties(), options);
	}	
	
}]);


BetaJS.Class.extend("BetaJS.Scopes.MultiScope", [
    BetaJS.Events.EventsMixin,
    BetaJS.Events.ListenMixin,
    {
	
	constructor: function (owner, base, query) {
		this._inherited(BetaJS.Scopes.MultiScope, "constructor");
		this.__owner = owner;
		this.__base = base;
		this.__queryStr = query;
		this.__query = this.__owner.__manager.query(this.__owner, query);
		this.__query.on("add", function (scope) {
			this.delegateEvents(null, scope);
			this.trigger("addscope", scope);
		}, this);
		this.__query.on("remove", function (scope) {
			scope.off(null, null, this);
			this.trigger("removescope", scope);
		}, this);
		BetaJS.Objs.iter(this.__query.result(), function (scope) {
			this.delegateEvents(null, scope);
		}, this);
		this.__freeze = false;
	},
	
	destroy: function () {
		BetaJS.Objs.iterate(this.__query.result(), function (scope) {
			scope.off(null, null, this);
		}, this);
		this.__query.destroy();
		this._inherited(BetaJS.Scopes.MultiScope, "destroy");
	},
	
	iterator: function () {
		return new BetaJS.Iterators.ArrayIterator(this.__query.result());
	},
	
	set: function (key, value) {
		var iter = this.iterator();
		while (iter.hasNext())
			iter.next().set(key, value);
		return this;
	},
	
	get: function (key) {
		var iter = this.iterator();
		return iter.hasNext() ? iter.next().get(key) : null;
	},
	
	define: function (name, func) {
		var iter = this.iterator();
		while (iter.hasNext())
			iter.next().define(name, func);
		return this;
	},
	
	call: function (name) {
		var iter = this.iterator();
		var result = null;
		while (iter.hasNext()) {
			var obj = iter.next();
			var local = obj.call.apply(obj, arguments);
			result = result || local;
		}
		return result;		
	},
	
	parent: function () {
		return this.__owner.scope(this.__base, this.__queryStr + "<");
	},
	
	root: function () {
		return this.__owner.root();
	},
	
	children: function () {
		return this.__owner.scope(this.__base, this.__queryStr + ">");
	},
	
	scope: function (base, query) {		
		if (arguments.length < 2) {
			query = this.__queryStr + base;
			base = this.__base;
		} 
		return this.__owner.scope(base, query);
	},
	
	materialize: function (returnFirst) {
		return returnFirst ? this.iterator().next() : this.iterator().asArray();
	},
	
	freeze: function () {
		this.__freeze = true;
		this.__query.off("add", null, this);
	}
	
}]);


BetaJS.Class.extend("BetaJS.Scopes.ScopeManager", [
    BetaJS.Trees.TreeNavigator,
    BetaJS.Classes.ObjectIdScopeMixin, {
	
	constructor: function (root) {
		this._inherited(BetaJS.Scopes.ScopeManager, "constructor");
		this.__root = root;
		this.__watchers = [];
		this.__query = this._auto_destroy(new BetaJS.Trees.TreeQueryEngine(this));
	},
	
	nodeRoot: function () {
		return this.__root;
	},
	
	nodeId: function (node) {
		return node.cid();
	},
	
	nodeParent: function (node) {
		return node.__parent;
	},
	
	nodeChildren: function (node) {
		return node.__children;
	},
	
	nodeData: function (node) {
		return node.data();
	},
	
	nodeWatch: function (node, func, context) {
		node.on("data", function () {
			func.call(context, "data");
		}, context);
		node.on("add", function (child) {
			func.call(context, "addChild", child);
		}, context);
		node.on("destroy", function () {
			func.call(context, "remove");
		}, context);
	},
	
	nodeUnwatch: function (node, func, context) {
		node.off(null, null, context);
	},
	
	query: function (scope, query) {
		return this.__query.query(scope, query);
	}
	
}]);
BetaJS.Dynamics.HandlerMixin = {
	
	_notifications: {
		_construct: "__handlerConstruct",
		_destruct: "__handlerDestruct"
	},
	
	__handlerConstruct: function () {
		
	},
	
	__handlerDestruct: function () {
		BetaJS.Objs.iter(this.__rootNodes, function (node) {
			node.destroy();
		});
	},
	
	_handlerInitialize: function (options) {
		options = options || {};
		this._parentHandler = options.parentHandler || null;
		var template = options.template || this.template;
		this.__element = options.element ? BetaJS.$(options.element) : null;
		if (template)
			this._handlerInitializeTemplate(template, options.parentElement);
		else {
			var templateUrl = options.templateUrl || this.templateUrl;
			if (templateUrl) {
				this.__deferActivate = true;
				BetaJS.Browser.Loader.loadHtml(templateUrl, function (template) {
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
		if (this.__element)
			this.__element.html(template);
		else if (parentElement) {
			BetaJS.$(parentElement).html(template);
			this.__element = BetaJS.$(parentElement).find(">");
		} else
			this.__element = BetaJS.$(template);
	},
	
	element: function () {
		return this.__element;
	},
	
	activate: function () {
		if (this.__deferActivate) {
			this.__deferedActivate = true;
			return;
		}			
		this.__rootNodes = [];
		var self = this;
		this.__element.each(function () {
			self.__rootNodes.push(new BetaJS.Dynamics.Node(self, null, this));
		});		
	}
	
		
};

BetaJS.Class.extend("BetaJS.Dynamics.Handler", [
    BetaJS.Dynamics.HandlerMixin,
    {
	
	constructor: function (options) {
		this._inherited(BetaJS.Dynamics.Handler, "constructor");
		options = options || {};
		this._properties = options.properties ? options.properties : new BetaJS.Properties.Properties();
		this.functions = {};
		this._handlerInitialize(options);
	},
	
	properties: function () {
		return this._properties;
	}	
	
}], {
	
	register: function (key, registry) {
		registry = registry || BetaJS.Dynamics.handlerRegistry;
		registry.register(key, this);
	}
	
});

BetaJS.Dynamics.handlerRegistry = new BetaJS.Classes.ClassRegistry();


BetaJS.Class.extend("BetaJS.Dynamics.HandlerPartial", {
	
	constructor: function (node, args, value) {
		this._inherited(BetaJS.Dynamics.HandlerPartial, "constructor");
		this._node = node;
		this._args = args;
		this._value = value;
		this._active = false;
	},
	
	change: function (value, oldValue) {
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
	
	_change: function (value, oldValue) {},
	
	_activate: function () {},
	
	_deactivate: function () {},
	
	_apply: function (value, oldValue) {},
	
	_execute: function () {
		var dyn = BetaJS.Dynamics.Parser.parseCode(this._value);
		this._node.__executeDyn(dyn);
	}
	
	
}, {
	
	register: function (key, registry) {
		registry = registry || BetaJS.Dynamics.handlerPartialRegistry;
		registry.register(key, this);
	}
	
});


BetaJS.Dynamics.handlerPartialRegistry = new BetaJS.Classes.ClassRegistry();

BetaJS.Class.extend("BetaJS.Dynamics.Node", [
    BetaJS.Events.EventsMixin,
	{
	
	constructor: function (handler, parent, element, locals) {
		this._inherited(BetaJS.Dynamics.Node, "constructor");
		this._handler = handler;
		this._parent = parent;
		if (parent)
			parent._children[BetaJS.Ids.objectId(this)] = this;
		this._element = element;
		
		this._tag = element.tagName ? element.tagName.toLowerCase() : "";
		if (this._tag.indexOf(":") >= 0)
			this._tag = this._tag.substring(this._tag.indexOf(":") + 1);
		this._dynTag = BetaJS.Dynamics.Parser.parseText(this._tag);
		this._tagHandler = null;
		
		this._$element = BetaJS.$(element);
		this._template = element.outerHTML;
		this._innerTemplate = element.innerHTML;
		this._locals = locals || {};
		this._active = true;
		this._dyn = null;
		this._children = {};
		this._locked = true;
		this._attrs = {};
		this._expandChildren = true;
		if (element.attributes) {
			for (var i = 0; i < element.attributes.length; ++i)
				this.__initializeAttr(element.attributes[i]);
		}
		this._locked = false;
		if (this._active) {
			this._active = false;
			this.activate();
		}
	},
	
	destroy: function () {
		BetaJS.Objs.iter(this._attrs, function (attr) {
			if (attr.partial)
				attr.partial.destroy();
			if (attr.dyn)
				this.__dynOff(attr.dyn);
		}, this);
		this._removeChildren();
		if (this._tagHandler)
			this._tagHandler.destroy();
		if (this._dyn)
			this.properties().off(null, null, this._dyn);
		if (this._parent)
			delete this._parent._children[BetaJS.Ids.objectId(this)];
		this._inherited(BetaJS.Dynamics.Node, "destroy");
	},
	
	element: function () {
		return this._element;
	},
	
	$element: function () {
		return this._$element;
	},
	
	__propGet: function (ns) {
		var p = ns.indexOf(".");
		var head = p >= 0 ? ns.substring(0, p) : ns;
		var tail = p >= 0 ? ns.substring(p + 1) : null;
		if (tail && head in this._locals && BetaJS.Properties.Properties.is_instance_of(this._locals[head]))
			return {props: this._locals[head], key: tail};
		return {props: this.properties(), key: ns};
	},
	
	__dynOff: function (dyn) {
		BetaJS.Objs.iter(dyn.dependencies, function (dep) {
			var prop = this.__propGet(dep);
			prop.props.off("change:" + prop.key, null, dyn);
		}, this);
	},
	
	__dynOn: function (dyn, cb) {
		var self = this;
		BetaJS.Objs.iter(dyn.dependencies, function (dep) {
			var prop = this.__propGet(dep);
			prop.props.on("change:" + prop.key, function () {
				cb.apply(self);
			}, dyn);
		}, this);
	},
	
	__initializeAttr: function (attr) {
		var obj = {
			name: attr.name,
			value: attr.value,
			domAttr: attr,
			dyn: BetaJS.Dynamics.Parser.parseText(attr.value)
		};
		this._attrs[attr.name] = obj;
		this.__updateAttr(obj);
		if (BetaJS.Dynamics.handlerPartialRegistry.get(obj.name))
			obj.partial = BetaJS.Dynamics.handlerPartialRegistry.create(obj.name, this, obj.dyn ? obj.dyn.args : {}, obj.value);
		if (obj.dyn) {
			this.__dynOn(obj.dyn, function () {
				this.__updateAttr(obj);
			});
			var self = this;
			if (obj.dyn.bidirectional && obj.name == "value") {
				this._$element.on("change keyup keypress keydown blur focus update", function () {
					var prop = self.__propGet(obj.dyn.variable);
					prop.props.set(prop.key, self._element.value);
				});
			}
		}
	},
	
	__executeDyn: function (dyn) {
		var funcs = BetaJS.Objs.map(this._handler.functions, function (f) {
			return BetaJS.Functions.as_method(f, this._handler);
		}, this);
		return BetaJS.Dynamics.Parser.executeCode(dyn, [this.properties(), this._locals, funcs]);
	},
	
	__updateAttr: function (attr) {
		var value = attr.dyn ? this.__executeDyn(attr.dyn) : attr.value;
		if (value != attr.value) {
			var old = attr.value;
			attr.value = value;
			attr.domAttr.value = value;
			if (attr.partial)
				attr.partial.change(value, old);
			if (attr.name == "value") {
				this._element.value = value;
			}
			this.trigger("change-attr:" + attr.name, value, old);
		}
	},
	
	__tagValue: function () {
		if (!this._dynTag)
			return this._tag;
		return this.__executeDyn(this._dynTag);
	},
	
	__unregisterTagHandler: function () {
		if (this._tagHandler) {
			this.off(null, null, this._tagHandler);
			this._tagHandler.destroy();
			this._tagHandler = null;
		}
	},
	
	__registerTagHandler: function () {
		this.__unregisterTagHandler();
		var tagv = this.__tagValue();
		if (!BetaJS.Dynamics.handlerRegistry.get(tagv))
			return false;
		this._tagHandler = BetaJS.Dynamics.handlerRegistry.create(tagv, {
			parentElement: this._$element.get(0),
			parentHandler: this._handler,
			autobind: false,
			tagName: tagv
		});
		this._$element.append(this._tagHandler.element());
		for (var key in this._attrs) {
			var attr = this._attrs[key];
			if (!attr.partial && key.indexOf("ba-") === 0) {
				var innerKey = key.substring("ba-".length);
				this._tagHandler.properties().set(innerKey, attr.value);
				if (attr.dyn) {
					var self = this;
					this.on("change-attr:" + key, function (value) {
						self._tagHandler.properties().set(innerKey, value);
					}, this._tagHandler);
					if (attr.dyn.bidirectional) {
						var prop = this.__propGet(attr.dyn.variable);
						this._tagHandler.properties().on("change:" + innerKey, function (value) {
							prop.props.set(prop.key, value);
						}, this);							
					}
				}
			}
		}
		this._tagHandler.activate();
		return true;
	},
	
	activate: function () {
		if (this._locked || this._active)
			return;
		this._locked = true;
		this._active = true;
		if (this._dynTag) {
			this.__dynOn(this._dynTag, function () {
				this.__registerTagHandler();
			});
		}
		var registered = this.__registerTagHandler(); 
        if (!registered && this._expandChildren) {
        	if (this._restoreInnerTemplate)
        		this._$element.html(this._innerTemplate);
			if (this._element.nodeType == this._element.TEXT_NODE) {
				this._dyn = BetaJS.Dynamics.Parser.parseText(this._element.textContent);
				if (this._dyn) {
					this.__dynOn(this._dyn, function () {
						this.__updateDyn();
					});
				}
			}
			this.__updateDyn();
			for (var i = 0; i < this._element.childNodes.length; ++i)
				this._registerChild(this._element.childNodes[i]);
		}
		this._$element.css("display", "");
		for (var key in this._attrs) {
			if (this._attrs[key].partial) 
				this._attrs[key].partial.activate();
		}
		this._locked = false;
	},
	
	__updateDyn: function () {
		if (!this._dyn)
			return;
		var value = this.__executeDyn(this._dyn);
		if (value != this._dyn.value) {
			this._dyn.value = value;
			this._element.textContent = value;
		}
	},
		
	_registerChild: function (element, locals) {
		return new BetaJS.Dynamics.Node(this._handler, this, element, BetaJS.Objs.extend(BetaJS.Objs.clone(this._locals, 1), locals));
	}, 
	
	_removeChildren: function () {
		BetaJS.Objs.iter(this._children, function (child) {
			child.destroy();
		});
	},
	
	deactivate: function () {
		if (!this._active)
			return;
		this._active = false;
		if (this._locked)
			return;
		this._locked = true;
		for (var key in this._attrs) {
			if (this._attrs[key].partial)
				this._attrs[key].partial.deactivate();
		}
		this._removeChildren();
		if (this._dynTag)
			this.__dynOff(this._dynTag);
		this.__unregisterTagHandler();
		if (this._dyn) {
			this.__dynOff(this._dyn);
			this._dyn = null;
		}
		this._$element.html("");
		this._restoreInnerTemplate = true;
		this._locked = false;
	},	
		
	properties: function () {
		return this._handler.properties();
	}
	
}]);

BetaJS.Dynamics.HandlerPartial.extend("BetaJS.Dynamics.ClassPartial", {
	
	_apply: function (value) {
		for (var key in value) {
			if (value[key])
				this._node._$element.addClass(key);
			else
				this._node._$element.removeClass(key);
		}
	}
	
});

BetaJS.Dynamics.ClassPartial.register("ba-class");

BetaJS.Dynamics.HandlerPartial.extend("BetaJS.Dynamics.ClickPartial", {
	
	constructor: function (node, args, value) {
		this._inherited(BetaJS.Dynamics.ClickPartial, "constructor", node, args, value);
		var self = this;
		this._node._$element.on("click", function () {
			self._execute();
		});
	}
		
});

BetaJS.Dynamics.ClickPartial.register("ba-click");

BetaJS.Dynamics.HandlerPartial.extend("BetaJS.Dynamics.IfPartial", {
	
	_apply: function (value) {
		if (value)
			this._node.activate();
		else
			this._node.deactivate();
	}
	
});

BetaJS.Dynamics.IfPartial.register("ba-if");

BetaJS.Dynamics.HandlerPartial.extend("BetaJS.Dynamics.IgnorePartial", {
			
	constructor: function (node, args, value) {
		this._inherited(BetaJS.Dynamics.IgnorePartial, "constructor", node, args, value);
		node.deactivate();
	}
	
});

BetaJS.Dynamics.IgnorePartial.register("ba-ignore");

BetaJS.Dynamics.HandlerPartial.extend("BetaJS.Dynamics.RepeatPartial", {
	
	constructor: function (node, args, value) {
		this._inherited(BetaJS.Dynamics.RepeatPartial, "constructor", node, args, value);
		node._expandChildren = false;
		node._$element.html("");
	},
	
	_activate: function () {		
		this.__register(this._value);
	},
	
	_deactivate: function () {
		this.__unregister();
	},
	
	_change: function (value, oldValue) {
		this.__register(value);
	},
	
	__register: function (value) {
		this.__unregister();
		if (!BetaJS.Collections.Collection.is_instance_of(value)) {
			BetaJS.Objs.iter(value, this.__appendItem, this);
		} else {
			this.__collection = value;
			this.__collection_map = {};
			this.__collection.iterate(function (item) {
				this.__collection_map[item.cid()] = this.__appendItem(item);
			}, this);
			this.__collection.on("add", function (item) {
				this.__collection_map[item.cid()] = this.__appendItem(item);
			}, this);
			this.__collection.on("remove", function (item) {
				var ele = this.__collection_map[item.cid()].$element();
				this.__collection_map[item.cid()].destroy();
				delete this.__collection_map[item.cid()];
				ele.remove();
			}, this);
		}
	},
	
	__unregister: function () {
		var $element = this._node._$element;
		this._node._removeChildren();
		$element.html("");
		if (this.__collection) {
			this.__collection.off(null, null, this);
			this.__collection = null;
			this.__collection_map = null;
		}
	},
	
	__appendItem: function (value) {
		this._node._$element.append(this._node._innerTemplate);			
		var element = this._node._$element.find(">:last").get(0);
		var locals = {};
		if (this._args)
			locals[this._args] = value;		
		return this._node._registerChild(element, locals);
	}
	
});

BetaJS.Dynamics.RepeatPartial.register("ba-repeat");
BetaJS.Dynamics.HandlerPartial.extend("BetaJS.Dynamics.ReturnPartial", {
	
	constructor: function (node, args, value) {
		this._inherited(BetaJS.Dynamics.ReturnPartial, "constructor", node, args, value);
		var self = this;
		this._node._$element.on("keypress", function (event) {
			if (event.which === 13)
				self._execute();
		});        
	}
		
});

BetaJS.Dynamics.ReturnPartial.register("ba-return");

BetaJS.Dynamics.HandlerPartial.extend("BetaJS.Dynamics.ShowPartial", {
	
	_apply: function (value) {
		if (value)
			this._node._$element.show();
		else
			this._node._$element.hide();
	}
	
});

BetaJS.Dynamics.ShowPartial.register("ba-show");
BetaJS.Scopes.Scope.extend("BetaJS.Dynamics.Dynamic", [
	BetaJS.Dynamics.HandlerMixin, 
	{
	
	constructor: function (options) {
		options = BetaJS.Objs.extend(this.initial, options);
		if (!options.parent && options.parentHandler) {
			var ph = options.parentHandler;
			while (ph && !options.parent) {
				options.parent = ph.instance_of(BetaJS.Dynamics.Dynamic) ? ph : null;
				ph = ph._parentHandler;
			}
		}
		this._inherited(BetaJS.Dynamics.Dynamic, "constructor", options);
		if (options.tagName) {
			this._tagName = options.tagName;
			this.data("tagname", this._tagName);
		}
		this.functions = this.__functions;
		this._handlerInitialize(options);
		if (options.create)
			options.create.apply(this);
	}
		
}], {
	
	register: function (key, registry) {
		registry = registry || BetaJS.Dynamics.handlerRegistry;
		registry.register(key, this);
	},
	
	activate: function (options) {
		var dyn = new this(options || {element: document.body});
		dyn.activate();
		return dyn;
	}

});