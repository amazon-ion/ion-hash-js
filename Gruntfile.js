module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-ts');
  grunt.loadNpmTasks('grunt-typedoc');
  grunt.loadNpmTasks('intern');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: ['dist', 'docs'],

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
          reporters: ['runner'],
          suites: [
            'dist/commonjs/es5/**/*.js',
          ],
        },
      },
    },

    typedoc: {
      build: {
        options: {
          excludeExternals: true,
          excludePrivate: true,
          hideGenerator: true,
          mode: 'file',
          module: 'commonjs',
          name: 'ion-hash-js',
          out: 'docs/api',
          target: 'es5',
        },
        src: 'src/*.ts',
      },
    },
  });

  grunt.registerTask('build',   ['clean', 'ts:commonjs-es5']);
  grunt.registerTask('test',    ['build', 'intern:es5']);
  grunt.registerTask('doc',     ['typedoc']);

  grunt.registerTask('default', ['test']);
  grunt.registerTask('release', ['test', 'doc']);
};

