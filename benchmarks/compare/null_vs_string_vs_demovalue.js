(function () {
	
	window.testnull = function () {
        var Dynamics = BetaJS.Dynamics;
		document.querySelector("fixture").innerHTML = '<ba-inner></ba-inner>';
        var testattr;
        for (var i = 0; i < 10000; ++i)
            testattr = null;

        Dynamics.Dynamic.extend(null, {
			template: "<p>{{testattr}}</p>",
            attrs: {testattr: testattr}
		}).register("ba-inner");
		var mainDynamic = new Dynamics.Dynamic({
			element: document.querySelector("fixture")
		});
        mainDynamic.activate();
        mainDynamic.destroy();
	};

    window.teststring = function () {
        var Dynamics = BetaJS.Dynamics;
        document.querySelector("fixture").innerHTML = '<ba-inner></ba-inner>';
        var testattr;
        for (var i = 0; i < 10000; ++i)
            testattr = 'test';

        Dynamics.Dynamic.extend(null, {
            template: "<p>{{testattr}}</p>",
            attrs: {testattr: testattr}
        }).register("ba-inner");
        var mainDynamic = new Dynamics.Dynamic({
            element: document.querySelector("fixture")
        });
        mainDynamic.activate();
        mainDynamic.destroy();
    };
	
	suite("be-assignvsclass", {
	}, function() {

		bench("Null", function () {
            testnull();
		});

        bench("String", function () {
            teststring();
        });

	});

}).call(this);