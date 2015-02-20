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
	
	root.find("button").click();

	QUnit.equal(dynamic.get("test"), true);
});