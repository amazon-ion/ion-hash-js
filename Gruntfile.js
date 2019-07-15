module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-ts');
  grunt.loadNpmTasks('intern');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: [
      'dist/',
      'docs/',
    ],

    ts: {
      options: {
        default: {
          tsconfig: './tsconfig.json',
          verbose: true,
        },
      },
      'commonjs-es5': {
        src: ['tests/**/*.ts'],
        outDir: 'dist/commonjs/es5',
        options: {
          target: "es5",
          module: "commonjs",
          declaration: true,
          sourceMap: true,
        },
      },
    },

    intern: {
      es5: {
        options: {
          reporters: ['pretty'],
          suites: [
            //'dist/commonjs/es5/**/*.js',
            //'dist/commonjs/es5/**/BigList*.js',
            'dist/commonjs/es5/**/IonHash*.js',
          ],
        },
      },
    },

    typedoc: {
      build: {
        options: {
          module: 'commonjs',
          target: 'es5',
          out: 'docs/api/',
          name: 'ion-hash-js',
        },
        src: 'src/**/*',
      },
    },
  });

  // define targets
  grunt.registerTask('build',   ['clean', 'ts:commonjs-es5']);
  grunt.registerTask('test',    ['build', 'intern:es5']);
  grunt.registerTask('default', ['test']);
};

