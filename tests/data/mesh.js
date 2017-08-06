QUnit.test("data/mesh : simple properties", function (assert) {
	var outer = new BetaJS.Properties.Properties();
	outer.set("inner", 1);
	var mesh = new BetaJS.Dynamics.Data.Mesh([outer], outer);
	var counter = 0;
	mesh.watch(["inner"], function () {
		counter++;
	}, {});
    assert.equal(counter, 0);
	outer.set("inner", 2);
    assert.equal(counter, 1);
});

QUnit.test("data/mesh : nested properties", function (assert) {
	var outer = new BetaJS.Properties.Properties();
	var inner1 = new BetaJS.Properties.Properties();
	var inner2 = new BetaJS.Properties.Properties();
	outer.set("inner", inner1);
	inner1.set("attr", "value1");
	inner2.set("attr", "value2");
	var mesh = new BetaJS.Dynamics.Data.Mesh([outer], outer);
	var counter = 0;
	mesh.watch(["inner.attr"], function () {
		counter++;
	}, {});
    assert.equal(counter, 0);
	inner1.set("attr", "value1x");
    assert.equal(counter, 1);
	outer.set("inner", inner2);
    assert.equal(counter, 2);
});

QUnit.test("data/mesh : nested properties 2", function (assert) {
	var outer = new BetaJS.Properties.Properties();
	var inner = new BetaJS.Properties.Properties();
	outer.set("inner", inner);
	inner.set("attr", "value");
	var mesh = new BetaJS.Dynamics.Data.Mesh([outer], outer);
	mesh.write("inner.attr", "foobar");
    assert.equal(inner.get("attr"), "foobar");
});