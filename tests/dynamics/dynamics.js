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