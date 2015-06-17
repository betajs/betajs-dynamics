Scoped.define("module:Handlers.Attr", [
	    "base:Class",
	    "module:Parser",
	    "jquery:",
	    "base:Types",
	    "module:Registries"
	], function (Class, Parser, $, Types, Registries, scoped) {
	var Cls;
	Cls = Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			constructor: function (node, attribute) {
				inherited.constructor.call(this);
				this._node = node;
				this._tagHandler = null;
				this._attrName = attribute.name;
				this._isEvent = this._attrName.indexOf("on") === 0;
				this._updatable = !this._isEvent;
				this._attrOriginalValue = attribute.value;
				this._attrValue = attribute.value;
				this._dyn = Parser.parseText(this._attrValue);
				if (this._dyn) {
					var self = this;
					node.mesh().watch(this._dyn.dependencies, function () {
						self.__updateAttr();
					}, this);
				}
				this.updateElement(node.element(), attribute);
			},
			
			destroy: function () {
				if (this._partial)
					this._partial.destroy();
				if (this._dyn)
					this._node.mesh().unwatch(this._dyn.dependencies, this);
				inherited.destroy.call(this);
			},
			
			updateElement: function (element, attribute) {
				this._element = element;
				this._$element = $(element);
				attribute = attribute || element.attributes[this._attrName];
				this._attribute = attribute;
				this.__updateAttr();
				var splt = this._attrName.split(":");
				if (this._partial)
					this._partial.destroy();
				if (Registries.partial.get(splt[0]))
					this._partial = Registries.partial.create(splt[0], this._node, this._dyn ? this._dyn.args : {}, this._attrValue, splt[1]);
				if (this._dyn) {
					var self = this;
					if (this._dyn.bidirectional && this._attrName == "value") {
						this._$element.on("change keyup keypress keydown blur focus update", function () {
							self._node.mesh().write(self._dyn.variable, self._element.value);
						});
					}
					if (this._isEvent) {
						this._attribute.value = '';
						this._$element.on(this._attrName.substring(2), function () {
              // Ensures the domEvent does not continue to
              // overshadow another variable after the __executeDyn call ends.
              var oldDomEvent = self._node._locals.domEvent;
							self._node._locals.domEvent = arguments;
							self._node.__executeDyn(self._dyn);
              self._node._locals.domEvent = oldDomEvent;
						});
					}
				}
			},
			
			__updateAttr: function () {
				if (!this._updatable)
					return;
				var value = this._dyn ? this._node.__executeDyn(this._dyn) : this._attrValue;
				if ((value != this._attrValue || Types.is_array(value)) && !(!value && !this._attrValue)) {
					var old = this._attrValue;
					this._attrValue = value;
					this._attribute.value = value;
					if (this._partial)
						this._partial.change(value, old);
					if (this._attrName === "value" && this._element.value !== value)
						this._element.value = value;
					if (this._tagHandler && this._dyn)
						this._tagHandler.properties().set(this._attrName.substring("ba-".length), value);
				}
			},

			bindTagHandler: function (handler) {
				this.unbindTagHandler();
				this._tagHandler = handler;
				if (!this._partial && this._attrName.indexOf("ba-") === 0) {
					var innerKey = this._attrName.substring("ba-".length);					
					this._tagHandler.setArgumentAttr(innerKey, this._attrValue);
					if (this._dyn && this._dyn.bidirectional) {
						this._tagHandler.properties().on("change:" + innerKey, function (value) {
							this._node.mesh().write(this._dyn.variable, value);
						}, this);							
					}
				}
			},
			
			unbindTagHandler: function (handler) {
				if (this._tagHandler)
					this._tagHandler.properties().off(null, null, this);
				this._tagHandler = null;
			},
			
			activate: function () {
				if (this._partial)
					this._partial.activate();
			},
			
			deactivate: function () {
				if (this._partial)
					this._partial.deactivate();
			}
			
		};
	});
	return Cls;
});
