var path = require('path');
var gulp = require('gulp');
var rename = require('gulp-rename');
var less = require('gulp-less');
var ts = require('gulp-typescript');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');
var autoprefixer = require('gulp-autoprefixer');

gulp.task('default', ['compile-ts', 'compile-less'], function()
{
    gulp.watch('./src/**/*.ts', ['compile-ts']);
    gulp.watch('./src/**/*.less', ['compile-less']);
});

gulp.task('compile-ts', function()
{
    var tsProject = ts.createProject('tsconfig.json', {out: 'SexyTable.js'});

    return tsProject.src()

        // Compile the typescript to javascript
        .pipe(ts(tsProject)).js

        // For some stupid reason we get a dot prefixing
        // the out filename if we don't do this.
        .pipe(rename({ basename: 'SexyTable' }))

        // Output the compiled unminified javascript
        .pipe(gulp.dest('./dist'))

        // Minify the js, rename it and save the minfied version
        .pipe(uglify())
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest('./dist'))

        // TODO: Sourcemap...
    ;
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
