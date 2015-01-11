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
			bind: {}
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
		return iter.hasNext() ? iter.next().get(key, value) : null;
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
		if (arguments.length < 2) 
			return this.__owner.scope(this.__base, this.__queryStr + query);
		else
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