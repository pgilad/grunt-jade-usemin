# [grunt](http://gruntjs.com/)-jade-usemin
> Grunt plugin for processing jade files and building production js & css files

[![NPM Version](http://img.shields.io/npm/v/grunt-jade-usemin.svg)](https://npmjs.org/package/grunt-jade-usemin)
[![Gittip](http://img.shields.io/gittip/pgilad.svg)](https://www.gittip.com/pgilad/)
[![Dependencies](http://img.shields.io/gemnasium/pgilad/grunt-jade-usemin.svg)](https://gemnasium.com/pgilad/grunt-jade-usemin)
[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

## Getting Started
This plugin requires Grunt.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-jade-usemin --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-jade-usemin');
```

## The "jadeUsemin" task

This project is based on the [grunt-usemin](https://github.com/yeoman/grunt-usemin) Project.
`grunt-jade-usemin` is meant to be an assisting tool in preparing projects for build.
The plugin will scan the parsed `.jade` files and extract the scripts from them.

Those scripts are then concated and minified into a single minified file.
jadeUsemin currently supports 2 types of `sources` to concat & minify: `js` and `css`.

### How to use in a Jade file

This is most effectively used in conjunction with the environment variable in express
i.e `process.env` or `node env`.

**jadeUsemin** simply scans for the following line: `<!-- build:<type> <target -->`.
Where `<target>` can be either `js` or `css`.

**jadeUsemin** then adds the scripts/styles inside the lines until it meets the closing line:
`<!-- endbuild -->` Which signifies the end of a usemin target.

##### for the following to work, you need to expose your `env` variable when rendering the jade file.
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

Running `**jadeUsemin**` on this file will concat & uglify the script files `script1.js` and `script2.js`
into a minified file `compiled.min.js`.

Another example is using **jadeUsemin** with css files:
```jade
//-<!-- build:css test/compiled/style.min.css -->
link(rel='stylesheet', href='/test/fixtures/style1.css')
link(rel='stylesheet', href='/test/fixtures/style2.css')
//-<!-- endbuild -->
```

jadeUsemin will create a minified css file called style.min.css which is a concated and minified version of both styles.

### Available Options

##### Uglify
`{Boolean} [uglify=true]` Whether grunt-contrib-uglify should be run on JS files as well as concat.
Specifying false will only concat the src js that are found.
Anything else will default to true, which will also uglify the js files.

##### Prefix
`{String} [prefix='']` This adds some flexibility to where you keep your public folder. It
allows you to add a prefix to the path.

##### replacePath
`{Object} [default={}]` This option allows you to specify interpolation patterns for the source and build paths of your js/css.
Each key value you specify here will be interpolated in the src paths that the plugin finds.
For example if you add: `'#{env}': 'dist'` then all occurances of `#{env}` in src paths will be replaced with `dist`.
This gives you the power to change the paths according to different working enviornments.

### Gruntfile.js basic task
In your project's Gruntfile, add a section named `jadeUsemin` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  jadeUsemin: {
    main: {
      options: {
        uglify: true, //optional - whether to run uglify js besides concat [default=true]
        prefix: '', //optional - add prefix to the path [default='']
        replacePath: {
            '#{env}': 'dist' //optional - key value to replace in src path
        }
      },
      files: {
        src: ['src/index.jade', 'src/index2.jade']
      }
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
