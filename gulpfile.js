var del = require('del');
var path = require('path');
var gulp = require('gulp');
var merge = require('merge2');
var rename = require('gulp-rename');
var less = require('gulp-less');
var ts = require('gulp-typescript');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');
var autoprefixer = require('gulp-autoprefixer');

gulp.task('default', ['clean-build', 'compile-ts', 'compile-less'], function()
{
    gulp.watch('./src/**/*.ts', ['compile-ts']);
    gulp.watch('./src/**/*.less', ['compile-less']);
});

gulp.task('clean-build', function (cb)
{
    del(['dist/**/*'], cb);
});

gulp.task('compile-ts', function()
{
    // Read in the TypeScript Project
    var tsProject = ts.createProject('tsconfig.json',
    {
        out: 'SexyTable.js',
        declarationFiles: true
    });

    // Compile the TypeScript
    var tsResult = tsProject.src().pipe(ts(tsProject));

    // Merge our 2 streams together
    return merge
    ([
        // Output the TypeScript Definitions
        tsResult.dts.pipe(gulp.dest('./dist')),

        // For some stupid reason we get a dot prefixing
        // the out filename if we don't do this.
        tsResult.js.pipe(rename({ basename: 'SexyTable' }))

        // Output the compiled unminified javascript
        .pipe(gulp.dest('./dist'))

        // Minify the js, rename it and save the minfied version
        .pipe(uglify())
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest('./dist'))
    ]);

    // TODO: Sourcemap...
});

gulp.task('compile-less', function()
{
    return gulp.src('./src/**/*.less')

        // Compile the less to css
        .pipe(less())

        .pipe(autoprefixer
        ({
            browsers: ['last 2 versions', 'ie 8', 'ie 9']
        }))

        // Output the compiled unminified css
        .pipe(gulp.dest('./dist'))

        // Minify the css, rename it and save the minfied version
        .pipe(uglifycss())
        .pipe(rename({ extname: '.min.css' }))
        .pipe(gulp.dest('./dist'))

        // TODO: Sourcemap...
    ;
});
