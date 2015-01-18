BetaJS.Dynamics.HandlerMixin = {
	
	_notifications: {
		_construct: "__handlerConstruct",
		_destruct: "__handlerDestruct"
	},
	
	__handlerConstruct: function () {
		
	},
	
	__handlerDestruct: function () {
		if (this.__rootNode)
			this.__rootNode.destroy();
	},
	
	_handlerInitialize: function (options) {
		options = options || {};
		this._parentHandler = options.parentHandler || null;
		var template = options.template || this.template;
		this.__element = options.element ? options.element : null;
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
			} else
				this._handlerInitializeTemplate(template, options.parentElement);
		}
	},
	
	_handlerInitializeTemplate: function (template, parentElement) {
		if (this.__element)
			BetaJS.$(this.__element).html(template);
		else if (parentElement) {
			BetaJS.$(parentElement).html(template);
			this.__element = BetaJS.$(parentElement).find(">").get(0);
		} else
			this.__element = BetaJS.$(template).get(0);
	},
	
	element: function () {
		return this.__element;
	},
	
	activate: function () {
		if (this.__deferActivate) {
			this.__deferedActivate = true;
			return;
		}			
		this.__rootNode = new BetaJS.Dynamics.Node(this, null, this.__element);
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
