BetaJS.Dynamics = BetaJS.Dynamics || {};

BetaJS.Properties.Meshes = {
	
	meshHas: function (scope, key) {
		var keys = key ? key.split(".") : [];
		for (var i = 0; i < keys.length; ++i) {
	       if (!scope || !BetaJS.Types.is_object(scope))
	    	   return false;
	       var alternative = {};
	       if (BetaJS.Properties.Properties.is_instance_of(scope))
	    	   alternative = scope.data();
	       scope = scope[keys[i]] || alternative[keys[i]];
	    }
		return BetaJS.Types.is_defined(scope);
	},
	
	meshRead: function (scope, key) {
		var keys = key ? key.split(".") : [];
		for (var i = 0; i < keys.length; ++i) {
	       if (!scope || !BetaJS.Types.is_object(scope))
	    	   return null;
	       var alternative = {};
	       if (BetaJS.Properties.Properties.is_instance_of(scope))
	    	   alternative = scope.data();
	       scope = scope[keys[i]] || alternative[keys[i]];
	    }
       /*if (BetaJS.Properties.Properties.is_instance_of(scope))
    	   scope = scope.data();*/
		return scope;
	},
	
	meshWrite: function (scope, key, value) {
		if (!key)
			return;			
		var result = this.meshInnerProps(scope, key);
		if (result) {
			result.props.set(result.key, value);
			return;
		}
		var keys = key.split(".");
		for (var i = 0; i < keys.length - 1; ++i) {
		   if (!(keys[i] in scope) || !BetaJS.Types.is_object(scope[keys[i]]))
				scope[keys[i]] = {};
	       scope = scope[keys[i]];
	    }
       	scope[keys[keys.length - 1]] = value;
	},
	
	meshInnerProps: function (scope, key) {
		var last_props = null;
		var last_props_idx = -1;
		var keys = key ? key.split(".") : [];
		for (var i = 0; i < keys.length; ++i) {
	       if (!scope || !BetaJS.Types.is_object(scope))
	    	   break;
	       var alternative = {};
	       if (BetaJS.Properties.Properties.is_instance_of(scope)) {
	    	   last_props = scope;
	    	   last_props_idx = i;
	    	   alternative = scope.data();
	       }	    	   
	       scope = scope[keys[i]] || alternative[keys[i]];
	    }
		if (!last_props)
			return null;
		return {
			props: last_props,
			key: keys.slice(last_props_idx).join(".")
		};
	}
			
};


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
	},
	
	executeCode: function (code, list) {
		if (BetaJS.Types.is_string(code))
			return code;
		var data = {};		
		BetaJS.Objs.iter(code.dependencies, function (dep) {
			for (var i = list.length - 1; i >= 0; --i) {
				if (BetaJS.Properties.Meshes.meshHas(list[i], dep)) {
					BetaJS.Properties.Meshes.meshWrite(data, dep, BetaJS.Properties.Meshes.meshRead(list[i], dep));
					break;
				}
			}
			var dep_head = (dep.split("."))[0];
			if (!(dep_head in data) && !(dep_head in window))
				BetaJS.Properties.Meshes.meshWrite(data, dep, null);
		});
		var result = code.func(data);
		BetaJS.Objs.iter(code.dependencies, function (dep) {
			for (var i = list.length - 1; i >= 0; --i) {
				if (i === 0 || BetaJS.Properties.Meshes.meshHas(list[i], dep)) {
					BetaJS.Properties.Meshes.meshWrite(list[i], dep, BetaJS.Properties.Meshes.meshRead(data, dep));
					break;
				}
			}
		});
		return result;
	}	

};