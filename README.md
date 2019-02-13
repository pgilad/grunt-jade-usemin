# [grunt](http://gruntjs.com/)-jade-usemin
> Grunt plugin for processing jade files and building production js & css files

[![NPM Version](http://img.shields.io/npm/v/grunt-jade-usemin.svg?style=flat)](https://npmjs.org/package/grunt-jade-usemin)
[![NPM Downloads](http://img.shields.io/npm/dm/grunt-jade-usemin.svg?style=flat)](https://npmjs.org/package/grunt-jade-usemin)
[![Build Status](http://img.shields.io/travis/pgilad/grunt-jade-usemin/master.svg?style=flat)](https://travis-ci.org/pgilad/grunt-jade-usemin)
[![Built with Grunt](http://img.shields.io/badge/BUILT_WITH-GRUNT-orange.svg?style=flat)](http://gruntjs.com/)

## Getting Started
This plugin requires Grunt.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install --save-dev grunt-jade-usemin
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
2. Locate **build blocks** defined by `<!-- build:type(alternate path) target -->`.
3. Gather **css** and **js** files in build blocks and run them through defined tasks for each filetype.
4. Optionally output an optimized jade with with only targets to replace the build block.

Currently only 2 types of build blocks are supported: `css` and `js`.

**jadeUsemin** also:

- Writes optimized jade files
- You choose which tasks to run for each filetype.

For example use `grunt-filerev` to add cache-busting to scripts/css.

### Usage

**For more usage examples head on to the [examples](examples/examples.md) section.**

#### Basic Example

To simply use the task, define your build blocks like so:
```jade
//-<!-- build:js public/js/scripts.min.js -->
script(src='./src/js/script1.js')
script(src='./src/js/script2.js')
//-<!-- endbuild -->

//-<!-- build:css test/compiled/style.min.css -->
link(rel='stylesheet', href='/test/fixtures/style1.css')
link(rel='stylesheet', href='/test/fixtures/style2.css')
//-<!-- endbuild -->
```

Then you need to define `grunt-jade-usemin` as a task in your `grunt config`.
You can use the following setup to process the above pattern:

```js
//...
jadeUsemin: {
    scripts: {
        options: {
            tasks: {
                js: ['concat', 'uglify'],
                css: ['concat', 'cssmin']
            }
        },
        files: [{
            dest: './src/partials/index.jade',
            src: './public/partials/index.jade'
        }]
    }
}
//...
```

Running `grunt jadeUsemin:scripts` will now concat and uglify `script1.js` and `script2.js`
and output them as `public/js/scripts.min.js`. This will also output an optimized jade file
that will remove the build block and contain:

```jade
script(src='public/js/scripts.min.js')
```

#### Optimized Jade Files

Writing target jade files is optional. `jadeUsemin` is smart enough that if you don't specify
a target for your src jade files, it won't output a jade file. This is useful if you are working on
server side jade files that build blocks still need to be optimized.

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

## API

### Build blocks

Build blocks have a strict design, so that they may be correctly caught by the regex.

```jade
<!-- build:type(alternate path) target -->
<!-- endbuild -->
```

- Build blocks must be all of the same type (or filetype).
- You can have as many different build blocks in the same file.
- Currently only supported blocks are of `js` or `css` types.
- If writing an optimized jade file, it uses the pattern of the first item to insert optimized script.
- **alternate path** is **optional** (along with the parenthesis). If used this task will also try
to find the script/css src files in the alternate path.

### Grunt Task

Tasks are *configurable* and *run in the order you specify*.
This gives you great flexibility in choosing which and how to run tasks on your build blocks.

The main task you need to define is called `jadeUsemin`.

Besides specifying the files object, you can use the following options:

#### Tasks

This is an array of objects, where `key=filetype` and value is an array of tasks to be run in order.

*Default* value is:

```js
tasks: {
    js: ['concat', 'uglify'],
    css: ['concat', 'cssmin']
}
```

In order to allow you to configure your tasks, `jadeUsemin` looks in the following places,
which are ordered by precedence:

1. `task.jadeUsemin.options`. For example: `uglify.jadeUsemin.options`.
2. `task.options`. For example: `uglify.options`.
3. Predefined default options for task if they exists.

This will allow you to control the options with which your tasks are being run on the build blocks.

Please note that the first task in each filetype runs against the original src files, and writes
the destination target file. All the rest of the tasks in the context of the filetype run on the
destination file.

**So basically saying - it makes the most sense to run `concat` first on the build blocks.**

##### Specifying no destination for directory tasks (such as filerev)

`grunt-jade-usemin` will look in options for `noDest` and will just specify a `src` for the file

So a possible way to configure `grunt-filerev` to rewrite the original files with the rev files would be:
```js
//in your grunt config
filerev: {
    jadeUsemin: {
        options: {
            noDest: true
        }
    }
},
```

##### Example usage with [grunt-autoprefixer](https://github.com/nDmitry/grunt-autoprefixer)

```js
tasks: {
    js: ['concat', 'uglify'],
    css: ['concat', 'autoprefixer', 'cssmin']
}
```

#### dirTasks

Type: `string[]|string`
Default: `[]`

If you have tasks that require a directory as destination (i.e [grunt-filerev](https://github.com/yeoman/grunt-filerev))
than you can use the `dirTasks` option to specify those in an array or string.

Example:
```js
dirTasks: ['filerev']
// or dirTasks: 'filerev'
```

This will parse the destination target as a directory, and not a file.

**important note** - If you use this option for any task, please make sure it is the last task that runs for a file type,
as it will output a file with different name as the original target.

#### Prefix
**String** `Default: ''`

This adds some flexibility to where you keep your public folder. It
allows you to add a prefix to the path.

## failOnMissingSource
**Boolean** `Default: false`

Should task fail if there are missing source files in the `jade`. If `false` there will only be a warning.

#### targetPrefix
**String** `Default: ''`

Same as the `prefix` but used for target location. If you specify a string here it will be prefixed
to the output of the target file.

#### replacePath
 **Object** `Default: {}`

This option allows you to specify interpolation patterns for the source and build paths of your js/css.
Each key value you specify here will be interpolated in the src paths that the plugin finds.
For example if you add: `'#{env}': 'dist'` then all occurrences of `#{env}` in src paths will be replaced with `dist`.
This gives you the power to change the paths according to different working environments.

#### Gruntfile.js full example
In your project's Gruntfile, add a section named `jadeUsemin` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  jadeUsemin: {
    main: {
      options: {
        tasks: { //optional if you want to use defaults
            js: ['concat', 'uglify', 'filerev'],
            css: ['concat', 'autoprefixer', 'cssmin']
        },
        dirTasks: 'filerev',       //optional
        failOnMissingSource: false // optional
        prefix: '',                //optional
        targetPrefix: '',          //optional
        replacePath: {             //optional
            '#{env}': 'dist'
        }
      },
      files: [{
        src: ['src/index.jade', 'src/index2.jade']
      },{
        src: ['src/index.jade'],
        dest: 'dist/index.jade'
     }]
    }
  },
})
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Contributors

- Pavol Pitonak [https://github.com/ppitonak](https://github.com/ppitonak)

## License

MIT © [Gilad Peleg](https://www.giladpeleg.com)
