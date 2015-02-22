Scoped.define("module:Data.Mesh", [
	    "base:Class",
	    "base:Events.EventsMixin",
	    "base:Properties.Properties",
	    "base:Objs",
	    "base:Types",
	    "base:Strings",
	    "base:Ids",
	    "base:Functions"
	], function (Class, EventsMixin, Properties, Objs, Types, Strings, Ids, Functions, scoped) {
	return Class.extend({scoped: scoped}, [EventsMixin, function (inherited) {
		return {

			constructor: function (environment, context) {
				inherited.constructor.call(this);
				this.__environment = environment;
				this.__context = context;
				this.__watchers = {};
			},
			
			destroy: function () {
				this.unwatch(Objs.keys(this.__watchers));
				inherited.destroy.call(this);
			},
			
			watch: function (expressions, callback, context) {
				Objs.iter(expressions, function (expression) {
					for (var i = this.__environment.length - 1; i >= 0; --i) {
						if (this._watch(this.__environment[i], expression, callback, context, i === 0))
							break;
					}
				}, this);
			},
			
			unwatch: function (expressions, context) {
				Objs.iter(expressions, function (expression) {
					this._unwatch(expression, context);
				}, this);
			},
			
			call: function (expressions, callback) {
				var data = {};
				var exprs = [];
				Objs.iter(expressions, function (expression) {
					var value = this.read(expression, true);
					if (value !== null || !(Strings.splitFirst(expression, ".").head in window)) {
						exprs.push(expression);
						data[expression] = value; 
					}
				}, this);
				
				var expanded = this.__expand(data);

				var result = callback.call(this.__context, expanded);

				var collapsed = this.__collapse(expanded, exprs);
				for (var expression in collapsed) {
					if (!(expression in data) || data[expression] != collapsed[expression])
						this.write(expression, collapsed[expression]);
				}
				return result;
			},
			
			read: function (expression, convertFunction) {
				for (var i = this.__environment.length - 1; i >= 0; --i) {
					var ret = this._read(this.__environment[i], expression);
					if (ret) {
						if (Types.is_function(ret.value))
							return Functions.as_method(ret.value, ret.context);
						return ret.value;
					}
				}
				return null;
			},
			
			write: function (expression, value) {
				for (var i = this.__environment.length - 1; i >= 0; --i) {
					if (this._write(this.__environment[i], expression, value, i === 0))
						break;
				}
			},
			
			_sub_navigate: function (properties, head, tail, parent, current) {
				var base = {
					properties: properties,
					head: head,
					tail: tail,
					parent: parent,
					current: current
				};
				if (!tail || !current || !Types.is_object(current))
					return base;
				var splt = Strings.splitFirst(tail, ".");
				var hd = head ? head + "." + splt.head : splt.head;
				if (Properties.is_instance_of(current)) {
					if (current.has(splt.head))
						return this._sub_navigate(current, splt.head, splt.tail, current, current.get(splt.head));
					else if (splt.head in current)
						return this._sub_navigate(properties, hd, splt.tail, current, current[splt.head]);
					else
						return base;
				} else if (splt.head in current)
					return this._sub_navigate(properties, hd, splt.tail, current, current[splt.head]);
				else 
					return base;
			},
			
			_navigate: function (scope, expression) {
				return this._sub_navigate(null, "", expression, null, scope);
			},
			
			_read: function (scope, expression) {
				var n = this._navigate(scope, expression);
				if (n.tail)
					return null;
				return {
					value: n.current,
					context: n.parent == scope ? this.__context : n.parent
				};
			},
			
			_write: function (scope, expression, value, force) {
				var n = this._navigate(scope, expression);
				if (n.tail && !force)
					return;
				var tail = n.tail.split(".");
				if (n.properties)
					n.properties.set(n.head + (n.head && n.tail ? "." : "") + n.tail, value);
				else {
					var current = n.current;
					for (var i = 0; i < tail.length - 1; ++i) {
						current[tail[i]] = {};
						current = current[tail[i]];
					}
					current[tail[tail.length - 1]] = value;
				}
			},
			
			_watch: function (scope, expression, callback, context, force) {
				if (!this.__watchers[expression]) {
					var n = this._navigate(scope, expression);
					if (force && !n.properties && Properties.is_instance_of(scope))
						n.properties = scope;
					if (!n.properties || (!force && n.tail))
						return false;
					var exp = n.head + (n.head && n.tail ? "." : "") + n.tail;
					this.__watchers[expression] = {
						props: n.properties,
						exp: exp,
						cbs: {}
					};
					n.properties.on("change:" + exp, function (tt) {
						Objs.iter(this.__watchers[expression].cbs, function (value) {
							value.callback.call(value.context);
						}, this);
					}, this);
				}
				this.__watchers[expression].cbs[Ids.objectId(context)] = {
					callback: callback,
					context: context
				};
				return true;
			},
			
			_unwatch: function (expression, context) {
				if (!this.__watchers[expression])
					return;
				if (context)
					delete this.__watchers[expression].cbs[Ids.objectId(context)];
				if (!context || Types.is_empty(this.__watchers[expression].cbs)) {
					this.__watchers[expression].props.off("change:" + this.__watchers[expression].exp, null, this);
					delete this.__watchers[expression];
				}
			},
			
			__expand: function (obj) {
				var result = {};
				Objs.iter(obj, function (value, key) {
					var current = result;
					var keys = key.split(".");
					for (var i = 0; i < keys.length - 1; ++i) {
						if (!(keys[i] in current) || !Types.is_object(current[keys[i]]))
							current[keys[i]] = {};
						current = current[keys[i]];
					}
					current[keys[keys.length - 1]] = value;
				});
				return result;
			},
			
			__collapse: function (obj, expressions) {
				var result = {};
				Objs.iter(expressions, function (expression) {
					var keys = expression.split(".");
					var current = obj;
					for (var i = 0; i < keys.length; ++i)
						current = current[keys[i]];
					result[expression] = current;
				});
				return result;
			}
			
		};
	}]);
});