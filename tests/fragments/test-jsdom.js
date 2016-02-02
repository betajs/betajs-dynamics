test("jsdom", function () {
	stop();
	require('jsdom').env("<div><div id='qunit-fixture'></div></div>", ["./vendors/jquery.min.js"], function (err, window) {
		global.window = window;
		global.navigator = window.navigator;
		global.document = window.document;
		global.jQuery = window.$;
		global.$ = window.$;
		Scoped.define("global:jQuery", function () {
			return window.$;
		});
		ok(true);
		start();
		var democases = [
            "demotests/betajs/set&get.html",
            "demotests/dynamic_scope.html",
    		"demotests/ba-class/change.html",
    		"demotests/ba-class/if.html",
    		"demotests/ba-repeat/array.html",
    		"demotests/ba-repeat/array_set_later.html",
    		"demotests/ba-repeat/access_item.html",
    		"demotests/ba-repeat/element_handler.html",
    		"demotests/ba-repeat/updates.html",
    		"demotests/ba-repeat/sort.html",
    		"demotests/ba-sharescope/share_scope.html",
    		"demotests/ba-sharescope/share_scope2.html",
    		"demotests/events/event_chain.html",
    		"demotests/events/event_partial.html",
    		"demotests/click_direct_code.html",
    		"demotests/domevents_test.html",
    		"demotests/extendables_test.html",
    		"demotests/function_inheritance.html",
    		"demotests/functions_handler.html",
    		"demotests/ignore.html",
    		"demotests/json_param_bind_attr.html",
    		"demotests/preserve_types.html",
    		"demotests/deep_change.html",
    		"demotests/template_partial.html",
    		"demotests/simple_bind.html",
    		"demotests/style_test.html"
    		/*
    		"demotests/helloworld.html",
    		"demotests/ba-if/if.html",
    		"demotests/on.html",
    		"demotests/ba-if/if_inject.html",
    		"demotests/attrs_partial_test.html",
    		"demotests/show.html",
    		"demotests/property_change.html",
    		"demotests/tag_handler.html",
    	 	"demotests/bind.html",
    		"demotests/bindings.html",
    		"demotests/input_value.html",
    		"demotests/inject.html",
    		*/
        ]; 
		democases.forEach(function (src) {
			var src = "tests/" + src;
			var title = BetaJS.Strings.splitLast(BetaJS.Strings.splitFirst(src, ".html").head, "/").tail.replace(/_/g, " ");				
			test("demotest : " + title, function () {
				stop();
				var content = require("fs").readFileSync(src, 'utf8');
				var parsed = $(content);
				var template = "";
				var code = "";
				parsed.each(function () {
					if (this.id == "test")
						$("#qunit-fixture").html("<div id='test'>" + $(this).html() + "</div>");
					if (this.tagName == "SCRIPT")
						code = $(this).html();
				});
				/*jslint evil: true */
				var f = new Function (code + "try {test();} catch (e) { QUnit.ok(false, e.toString()); }");
				var windowKeys = BetaJS.Objs.clone(window, 1);
				f();
				BetaJS.Objs.iter(window, function (value, key) {
					if (!(key in windowKeys))
						delete window[key];
				});
				start();
			});
		});
	});		
});
