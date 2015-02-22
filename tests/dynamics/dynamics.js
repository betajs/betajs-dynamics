
test("test input value", function() {
	var root = $("#qunit-fixture");
	root.html($("#test-input-value").html());
	var dynamic = new BetaJS.Dynamics.Dynamic({ element: root.get(0) });

	dynamic.set("text", "foobar");
	dynamic.activate();
	
	QUnit.equal(root.find("p").html().trim(), "foobar");
	
	root.find("input").val("test");
	root.find("input").keypress();
	
	QUnit.equal(dynamic.get("text"), "test");
	QUnit.equal(root.find("p").html().trim(), "test");
});



test("test repeat array", function() {
	var root = $("#qunit-fixture");
	root.html($("#test-repeat-array").html());
	var dynamic = new BetaJS.Dynamics.Dynamic({ element: root.get(0) });
	
	var array = ["A", "B", "C"];
	dynamic.set("items", array);
	dynamic.activate();
	QUnit.equal(root.children().length, 1);
	var elements = root.find("li");
	QUnit.equal(elements.length, array.length);
	for (var i = 0; i < elements.length; ++i)
		QUnit.equal(elements.get(i).innerHTML, array[i]);
});


test("test ignore", function () {
	var root = $("#qunit-fixture");
	root.html($("#test-ignore").html());
	var dynamic = new BetaJS.Dynamics.Dynamic({ element: root.get(0) });
	dynamic.activate();
	
	QUnit.equal(root.find("p").html().trim(), "{{inner}}");
});


test("test property change", function () {
	var root = $("#qunit-fixture");
	root.html($("#test-property-change").html());
	var dynamic = new BetaJS.Dynamics.Dynamic({ element: root.get(0) });
	
	dynamic.set("foo", "test");
	dynamic.set("prop", new BetaJS.Properties.Properties({ foo: "bar"}));
	dynamic.activate();
	
	QUnit.equal(root.find("#test1").html().trim(), "test");
	QUnit.equal(root.find("#test2").html().trim(), "bar");
	
	dynamic.set("foo", "moo");
	dynamic.get("prop").set("foo", "baz");

	QUnit.equal(root.find("#test1").html().trim(), "moo");
	QUnit.equal(root.find("#test2").html().trim(), "baz");
});


test("test click direct code", function () {
	var root = $("#qunit-fixture");
	root.html($("#test-click-direct-code").html());
	var dynamic = new BetaJS.Dynamics.Dynamic({ element: root.get(0) });
	
	dynamic.set("test", false);
	dynamic.activate();
	
	QUnit.equal(dynamic.get("test"), false);

	root.find("button").click();

	QUnit.equal(dynamic.get("test"), true);

	root.find("button").click();

	QUnit.equal(dynamic.get("test"), false);
});


test("test class change", function () {
	var root = $("#qunit-fixture");
	root.html($("#test-class-change").html());
	var dynamic = new BetaJS.Dynamics.Dynamic({ element: root.get(0) });
	
	dynamic.set("a", false);
	dynamic.set("b", {v: false});
	dynamic.set("c", new BetaJS.Properties.Properties({v : false}));
	dynamic.activate();
	
	var button = root.find("button");

	QUnit.equal(button.hasClass("a"), false);
	QUnit.equal(button.hasClass("b"), false);
	QUnit.equal(button.hasClass("c"), false);
	dynamic.set("a", true);
	QUnit.equal(button.hasClass("a"), true);
	QUnit.equal(button.hasClass("b"), false);
	QUnit.equal(button.hasClass("c"), false);
	dynamic.set("a", false);
	QUnit.equal(button.hasClass("a"), false);
	dynamic.set("b.v", true);
	QUnit.equal(button.hasClass("a"), false);
	QUnit.equal(button.hasClass("b"), true);
	QUnit.equal(button.hasClass("c"), false);
	dynamic.get("c").set("v", true);
	QUnit.equal(button.hasClass("a"), false);
	QUnit.equal(button.hasClass("b"), true);
	QUnit.equal(button.hasClass("c"), true);
});