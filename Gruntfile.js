module.exports = function(grunt) {

	var pkg = grunt.file.readJSON('package.json');
	var gruntHelper = require('betajs-compile');
	var dist = 'betajs-dynamics';

	gruntHelper.init(pkg, grunt)
	
	
    /* Compilation */    
	.scopedclosurerevisionTask(null, "src/**/*.js", "dist/" + dist + "-noscoped.js", {
		"module": "global:BetaJS.Dynamics",
		"base": "global:BetaJS",
		"browser": "global:BetaJS.Browser"
    }, {
    	"base:version": pkg.devDependencies.betajs,
    	"browser:version": pkg.devDependencies["betajs-browser"]
    })	
    .concatTask('concat-scoped', [require.resolve("betajs-scoped"), 'dist/' + dist + '-noscoped.js'], 'dist/' + dist + '.js')
    .uglifyTask('uglify-noscoped', 'dist/' + dist + '-noscoped.js', 'dist/' + dist + '-noscoped.min.js')
    .uglifyTask('uglify-scoped', 'dist/' + dist + '.js', 'dist/' + dist + '.min.js')
    .packageTask()
	.autoincreasepackageTask(null, "package-source.json")
	.jsbeautifyTask(null, "src/**/*.js")

    /* Testing */
    .browserqunitTask(null, "tests/tests.html", true)
	.qunitjsTask(null, ["tests/qunitjs-node.js"])
    .closureTask(null, [require.resolve("betajs-scoped"), require.resolve("betajs"), require.resolve("betajs-browser"), "./dist/betajs-dynamics-noscoped.js"], null, { })
    .browserstackTask(null, 'tests/tests.html', {desktop: true, mobile: true})
    .lintTask(null, ['./src/**/*.js', './dist/' + dist + '-noscoped.js', './dist/' + dist + '.js', './Gruntfile.js', './tests/**/*.js', './benchmarks/**/*.js'])
    
    /* External Configurations */
    .codeclimateTask()
    .travisTask(null, "4.0")
//	.githookTask(null, "pre-commit", "check-node")
    
    /* Markdown Files */
	.readmeTask()
    .licenseTask()
    
    /* Documentation */
    .docsTask();

	grunt.initConfig(gruntHelper.config);	

	grunt.registerTask('default', ['autoincreasepackage', 'package', 'readme', 'license', 'codeclimate', 'travis', 'jsbeautify', 'scopedclosurerevision', 'concat-scoped', 'uglify-noscoped', 'uglify-scoped']);
	grunt.registerTask('check-node', [ 'lint', 'qunitjs' ]);
	grunt.registerTask('check', ['check-node', 'browserqunit']);

};
