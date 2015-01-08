module.banner = '/*!\n<%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\nCopyright (c) <%= pkg.contributors %>\n<%= pkg.license %> Software License.\n*/\n';

module.exports = function(grunt) {

	grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),
		concat : {
			options : {
				banner : module.banner
			},
			dist : {
				dest : 'dist/betajs-dynamics.js',
				src : [
					'src/data/*.js',
					'src/handlers/*.js',
					'src/partials/*.js',
					'src/dynamics/*.js'
				]
			},
		},
		uglify : {
			options : {
				banner : module.banner
			},
			dist : {
				files : {
					'dist/betajs-dynamics.min.js' : [ 'dist/betajs-dynamics.js' ],					
				}
			}
		},
		shell: {
			lint: {
		    	command: "jsl +recurse --process ./src/*.js",
		    	options: {
                	stdout: true,
                	stderr: true,
            	},
            	src: [
            		"src/*/*.js"
            	]
			}
		},
	});

	grunt.loadNpmTasks('grunt-newer');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-shell');	

	grunt.registerTask('default', ['newer:concat', 'newer:uglify']);
	grunt.registerTask('lint', ['shell:lint']);	
	grunt.registerTask('check', ['lint']);

};