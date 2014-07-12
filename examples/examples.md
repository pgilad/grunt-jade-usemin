# Example Usages

All tasks can be run using `grunt jadeUsemin:scripts` or just `grunt jadeUsemin`.

## basic javascript pattern

This example shows the basic usage of this plugin:
concatenate and uglify javascript files found in a `sample.jade` file.

We will also be writing an output optimized jade file.

### Jade file: sample.jade

```jade
//-<!-- build:js public/js/scripts.min.js -->
script(src='./src/js/script1.js')
script(src='./src/js/script2.js')
//-<!-- endbuild -->
```
### Grunt config

```js
//...
jadeUsemin: {
    scripts: {
        options: {
            tasks: {
                js: ['concat', 'uglify']
            }
        },
        files: [{
            dest: './src/partials/sample.jade',
            src: './public/partials/sample.jade'
        }]
    }
}
//...
```

## Combined CSS & JS example

This example shows a usage case of a jade file containing both css files and js scripts.

### Jade file: combined.jade

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

### Grunt config

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
            dest: './src/partials/combined.jade',
            src: './public/partials/combined.jade'
        }]
    }
}
//...
```

## Server side only jade

This is most effectively used in conjunction with the environment variable in express
i.e `process.env` or `node env`.

**Note:** for the following to work, you need to expose your `env` variable when rendering the jade file.

### Sample server.jade

```jade
if env === 'development'
    //-<!-- build:js public/js/compiled.min.js -->
    script(src='/src/js/script1.js')
    script(src='/src/js/script2.js')
    //-<!-- endbuild -->
else
    script(src='/public/js/compiled.min.js')
```

### Sample grunt config

And your `grunt config` can look something like this:
```js
//...
jadeUsemin: {
    scripts: {
        options: {
            tasks: {
                js: ['concat', 'uglify']
            }
        },
        files: [{src:'./app/views/server.jade'}]
    }
}
//...
```

## Advanced tasks - filerev & autoprefixer

This example shows how advanced tasks can be added to the build steps. We will add autoprefixer to the css task stack and file rev to both css and js task stacks.

### Sample advanced.jade

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

### Sample grunt config

```js
//...
jadeUsemin: {
    scripts: {
        options: {
            tasks: {
                js: ['concat', 'uglify', 'filerev'],
                css: ['concat', 'autoprefixer', 'cssmin', 'filerev']
            },
            dirTasks: ['filerev']
        },
        files: [{
            dest: './src/partials/combined.jade',
            src: './public/partials/combined.jade'
        }]
    }
}
//...
```
