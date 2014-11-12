# gulp-source-map-unzip
Unzip (using zlib.createUnzip()) files which are detected as being zipped.

Accepts source files in source map form.

## Install
```bash
$ npm install --save-dev gulp-source-map-unzip
```

## Usage
```js
    var gulp = require('gulp'),
        sourceMapUnzip = require('gulp-source-map-unzip')
        /* additional modules to create a useful demonstration */
        mainBowerFiles = require('main-bower-files'),
        concat = require('gulp-concat-util');

    var paths = {
        javascript: {
            source: './app/scripts/**/*.coffee',
            destination: './public/scripts/**/*.js',
            targetFolder: './public/scripts'
        }
    };

    gulp.task('combine-bower', function() {
        var bowerOpts = { base: './public/bower_components' };
        return gulp.src(mainBowerFiles(), bowerOpts)
            .pipe(sourcemaps.init())
                .pipe(sourceMapUnzip(bowerOpts)
            .pipe(sourcemaps.write())
            .pipe(concat('combined-bower.js'))
            .pipe(gulp.dest(paths.javascript.targetFolder + 'lib/'));
    });
```

## License
[MIT](http://opensource.org/licenses/MIT)
