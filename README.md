# grunt-jade-usemin

> Grunt plugin for running UseMin on Jade files

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

### Overview
In your project's Gruntfile, add a section named `jadeUsemin` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  jadeUsemin: {
    main: {
      options: {},
      files: {
        src: ['src/testing', 'src/123'],
      }
    }
  },
})
```

### Options

### Usage Examples

#### Default Options

```js
grunt.initConfig({
  jadeUsemin: {
    main: {
      options: {},
      files: {
        src: ['src/testing', 'src/123'],
      }
    }
  },
})
```

#### Custom Options

```js
grunt.initConfig({
  jadeUsemin: {
    main: {
      options: {},
      files: {
        src: ['src/testing', 'src/123'],
      }
    }
  },
})
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2013 Gilad Peleg. Licensed under the MIT license.
