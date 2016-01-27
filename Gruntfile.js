module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');

    // 1. All configuration goes here 
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            build: {
                src: 'public/js/client.js',
                dest: 'public/js/client.min.js'
            }
        },
        watch: {
            options: {
                livereload: true
            },
            scripts: {
                files: ['client/**/*.js','test/**/*.js'],
                tasks: ['build_dev'],
                options: {
                    spawn: false
                }
            }
        },

        browserify: {
            options: {
                browserifyOptions: {
                    debug: true
                }
            },
            dev: {
                options: {
                    debug: true,
                    transform: ['debowerify']
                },
                files: {
                    './public/js/client.js' : './client/client.all.js',
                    './public/js/svg.js' : './client/client.svg.js',
                    './public/js/dala.diagram.js' : './client/client.diagram.js',
                    './public/js/test.js' : './test/test.svg.js',
                    './public/js/test_diagram.js' : './test/test.diagram.js'
                }
            }
        }
    });

    //Imagemin ?

    grunt.registerTask('default', ['browserify', 'uglify']);
    grunt.registerTask('build_dev', ['browserify']);

};