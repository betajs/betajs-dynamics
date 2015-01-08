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
		BetaJS.Objs.iter(code.dependencies, function (dep) {
			dep = dep.indexOf(".") >= 0 ? dep.substring(0, dep.indexOf(".")) : dep;
			for (var i = list.length - 1; i >= 0; --i) {
				if (dep in list[i]) {
					data[dep] = list[i][dep];
					if (data[dep] && BetaJS.Properties.Properties.is_instance_of(data[dep]))
						data[dep] = data[dep].data();
					break;
				}
			}
			if (!(dep in data) && !(dep in window))
				data[dep] = null;
		});
		var result = code.func(data);
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