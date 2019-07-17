module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-ts');
  grunt.loadNpmTasks('intern');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: [
      'dist',
    ],

    ts: {
      tsconfig: 'tsconfig.json',
      'commonjs-es5': {
        outDir: 'dist/commonjs/es5',
        options: {
          target: 'es5',
          module: 'commonjs',
        },
      },
    },

    intern: {
      es5: {
        options: {
          reporters: ['pretty'],
          suites: [
            'dist/commonjs/es5/**/*.js',
            //'dist/commonjs/es5/**/BigList*.js',
            //'dist/commonjs/es5/**/IonHash*.js',
          ],
        },
      },
    },

    typedoc: {
      build: {
        options: {
          module: 'commonjs',
          target: 'es5',
          out: 'docs/api',
          name: 'ion-hash-js',
        },
        src: 'src/**/*',
      },
    },
  });

  grunt.registerTask('build',   ['clean', 'ts:commonjs-es5']);
  grunt.registerTask('test',    ['build', 'intern:es5']);
  grunt.registerTask('default', ['test']);
};

