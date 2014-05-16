# [grunt](http://gruntjs.com/)-jade-usemin
> Grunt plugin for processing jade files and building production js & css files

[![NPM Version](http://img.shields.io/npm/v/grunt-jade-usemin.svg?style=flat)](https://npmjs.org/package/grunt-jade-usemin)
[![NPM Downloads](http://img.shields.io/npm/dm/grunt-jade-usemin.svg?style=flat)](https://npmjs.org/package/grunt-jade-usemin)
[![Dependencies](http://img.shields.io/gemnasium/pgilad/grunt-jade-usemin.svg?style=flat)](https://gemnasium.com/pgilad/grunt-jade-usemin)
[![Build Status](http://img.shields.io/travis/pgilad/grunt-jade-usemin/master.svg?style=flat)](https://travis-ci.org/pgilad/grunt-jade-usemin)
[![Built with Grunt](http://img.shields.io/badge/BUILT_WITH-GRUNT-orange.svg?style=flat)](http://gruntjs.com/)

## Getting Started
This plugin requires Grunt.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-jade-usemin --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of Javascript:

```js
grunt.loadNpmTasks('grunt-jade-usemin');
```

## The "jadeUsemin" task

This project is based on the [grunt-usemin](https://github.com/yeoman/grunt-usemin) Project.
`grunt-jade-usemin` is meant to be an assisting tool in preparing projects for build.

The steps of this plugin are as follows:

1. Scan **src** jade files.
2. Locate **build blocks** defined by `<!-- build:type target -->`.
3. Gather **css** and **js** files in build blocks and run them through concat, cssmin & uglify.
4. (**new in version 0.4.0**) Optionally output an optimized jade with with only targets to replace the build block.

Currently only 2 types of build blocks are supported: `css` and `js`.

### How to use in a Jade file

This is most effectively used in conjunction with the environment variable in express
i.e `process.env` or `node env`.

**jadeUsemin** scans for the following line: `<!-- build:<type> <target> -->`.

**jadeUsemin** then adds the scripts/styles inside the lines until it meets the closing line:
`<!-- endbuild -->` Which signifies the end of a usemin build block.

**Note:** for the following to work, you need to expose your `env` variable when rendering the jade file.

This is an example `index.jade`:

```jade
if env === 'development'
    //-<!-- build:js test/compiled/compiled.min.js -->
    script(src='/test/fixtures/script1.js')
    script(src='/test/fixtures/script2.js')
    //-<!-- endbuild -->
else
    script(src='/test/compiled/compiled.min.js')
```

Running **jadeUsemin** on this file will concat & uglify the script files `script1.js` and `script2.js`
into a minified file `compiled.min.js`.

Another example is using **jadeUsemin** with css files:
```jade
//-<!-- build:css test/compiled/style.min.css -->
link(rel='stylesheet', href='/test/fixtures/style1.css')
link(rel='stylesheet', href='/test/fixtures/style2.css')
//-<!-- endbuild -->
```

**jadeUsemin** will create a minified css file called style.min.css which is a concated and minified version of both styles.

#### Optimized jade file output [**new in version 0.4.0**]

`grunt-jade-usemin` has the option to output optimized jade files. This means you can remove the development build blocks
and turn them into their optimized counterparts.

In your grunt configuration you need to configure a destination file (see: [grunt files](http://gruntjs.com/configuring-tasks#files)).

Then if your `src` jade file is:

```jade
//-<!-- build:css test/compiled/style.min.css -->
link(rel='stylesheet', href='/test/fixtures/style1.css')
link(rel='stylesheet', href='/test/fixtures/style2.css')
//-<!-- endbuild -->
```

Your target jade file will turn into:

```jade
link(rel='stylesheet', href='test/compiled/style.min.css')
```

**Note:** in order to create the optimized target, `grunt-jade-usemin` takes the first src in the relevant build block found and uses that as a template

### Available Options

#### Uglify
**Boolean** `Default: true`. Whether grunt-contrib-uglify should be run on JS files as well as concat.
Specifying false will only concat the src js that are found.
Anything else will default to true, which will also uglify the js files.

#### Prefix
**String** `Default: ''`. This adds some flexibility to where you keep your public folder. It
allows you to add a prefix to the path.

#### replacePath
 **Object** `Default: {}`. This option allows you to specify interpolation patterns for the source and build paths of your js/css.
Each key value you specify here will be interpolated in the src paths that the plugin finds.
For example if you add: `'#{env}': 'dist'` then all occurrences of `#{env}` in src paths will be replaced with `dist`.
This gives you the power to change the paths according to different working environments.

### Gruntfile.js basic task
In your project's Gruntfile, add a section named `jadeUsemin` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  jadeUsemin: {
    main: {
      options: {
        uglify: true, //whether to run uglify js besides concat [default=true]
        prefix: '', //optional - add prefix to the path [default='']
        replacePath: {
            '#{env}': 'dist' //optional - key value to replace in src path
        }
      },
      files: [{
        src: ['src/index.jade', 'src/index2.jade']
      },
        src: ['src/index.jade'],
        dest: 'dist/index.jade'
     }]
    }
  },
})
```

### Usage Examples

#### Default Options

```js
grunt.initConfig({
  jadeUsemin: {
    main: {
      options: {
        uglify:true
      },
      files: {
        src: ['src/testing', 'src/123'],
      }
    }
  },
})
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## License
Copyright (c) 2014 Gilad Peleg. Licensed under the MIT license.
