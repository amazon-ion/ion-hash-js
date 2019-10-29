/*
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */
module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-ts');
  grunt.loadNpmTasks('grunt-typedoc');
  grunt.loadNpmTasks('intern');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: ['build', 'dist', 'docs'],

    ts: {
      'commonjs-es5': {
        tsconfig: 'tsconfig.commonjs.json',
      },
      'tests': {
        tsconfig: 'tsconfig.tests.json',
      },
    },

    intern: {
      es5: {
        options: {
          reporters: ['runner'],
          suites: [
            'build/tests/*.js',
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
  grunt.registerTask('test',    ['build', 'ts:tests', 'intern:es5']);
  grunt.registerTask('doc',     ['typedoc']);

  grunt.registerTask('default', ['test']);
  grunt.registerTask('release', ['test', 'doc']);
};

