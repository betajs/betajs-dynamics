(function () {
	
	window.baclass = function () {
        var Dynamics = BetaJS.Dynamics;
		document.querySelector("fixture").innerHTML = '<div ba-repeat="{{item::list}}"><ba-inner ba-item="{{item}}"></ba-inner></div>';
		var list = [];
		for (var i = 0; i < 10; ++i)
			list.push({foobar: "Item " + i});
		Dynamics.Dynamic.extend(null, {
			template: "<p>{{item.foobar}}</p>"
		}).register("ba-inner");
		var mainDynamic = new Dynamics.Dynamic({
			element: document.querySelector("fixture"),
			attrs: {
				list: list
			}
		});
		mainDynamic.activate();
		mainDynamic.destroy();
	};

    window.assign = function () {
        // var Dynamics = BetaJS.Dynamics;

        document.querySelector("fixture").innerHTML = '<style>fixture div {display: block; height: 10px; width: 10px;}</style>';
        document.querySelector("fixture").appendChild(document.createElement("div"));

        var element = document.querySelector("fixture div");
        var iterations = 1000;

        var f = function () {

            Object.assign(element.style, {
                color: 'white',
                background: 'black'
            });

            BetaJS.Async.eventually(function () {
                Object.assign(element.style, {
                    color: null,
                    background: null
                });
            });
        };

        for (var i = 0; i < iterations; ++i) {
			f();
		}
    };

    window.CSSclass = function () {
        // var Dynamics = BetaJS.Dynamics;

        document.querySelector("fixture").innerHTML =
			'<style>' +
				'fixture div {display: block; height: 10px; width: 10px;}' +
        		'.someclass {color: white; background: black;' +
			'</style>';
        document.querySelector("fixture").appendChild(document.createElement("div"));

        var element = document.querySelector("fixture div");
        var iterations = 1000;

        var f = function () {

            element.className += "someclass";

            BetaJS.Async.eventually(function () {
                element.classList.remove("someclass");
            });

        };

        for (var i = 0; i < iterations; ++i) {
			f();
        }
    };
	
	suite("be-assignvsclass", {
	}, function() {

		bench("Assign", function () {
			assign();
		});

        bench("Class", function () {
            CSSclass();
        });
	
	});

}).call(this);