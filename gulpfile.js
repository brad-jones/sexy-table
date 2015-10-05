// Import some modules
var
    Q =            require('q'),
    del =          require('del'),
    merge =        require('merge2'),
    gulp =         require('gulp'),
    run =          require('gulp-run'),
    bump =         require('gulp-bump'),
    rename =       require('gulp-rename'),
    less =         require('gulp-less'),
    ts =           require('gulp-typescript'),
    uglify =       require('gulp-uglify'),
    uglifycss =    require('gulp-uglifycss'),
    autoprefixer = require('gulp-autoprefixer'),
    gitTagV =      require('gulp-tag-version')
;

/**
 * Runs after ```npm install```, performs some final setup.
 */
gulp.task('npm-postinstall', function(done)
{
    run('npm install transparency@^0.10.0 --ignore-scripts').exec(function()
    {
        run('tsd reinstall').exec(function()
        {
            run('tsd rebundle').exec(function()
            {
                run('git checkout typings/custom.d.ts').exec(done);
            });
        });
    });
});

/**
 * Deletes everything inside the dist folder
 * to ensure we don't get stale artifacts.
 */
gulp.task('clean', function (done)
{
    del(['./dist/**/*'], done);
});

/**
 * Compiles all typescript source files into javascript.
 */
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

/**
 * Compiles all less source files into css.
 */
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

/**
 * Creates a fresh build from all source files.
 */
gulp.task('build', ['clean', 'compile-ts', 'compile-less']);

/**
 * Watches source for changes and will continuously re-build until stopped.
 */
gulp.task('watch', ['build'], function()
{
    gulp.watch('./src/**/*.ts', ['compile-ts']);
    gulp.watch('./src/**/*.less', ['compile-less']);
});

/**
 * Increments the version number of the main package.json file.
 */
gulp.task('bump', function()
{
    gulp.src('./package.json')
    .pipe(bump())
    .pipe(gulp.dest('./'));
});

/**
 * Creates a new git tag and pushes to github.
 */
gulp.task('tag', ['build', 'bump'], function()
{
    var deferred = Q.defer();

    var complete = 0, done = function()
    {
        ++complete; if (complete == 2) deferred.resolve();
    };

    run('git add -A').exec(function()
    {
        run("git commit -m NewBuild").exec(function()
        {
            run('git push').exec(done);

            gulp.src('./package.json').pipe(gitTagV()).on('end', function()
            {
                run('git push --tags').exec(done);
            });
        });
    });

    return deferred.promise;
});

/**
 * Publishes the npm package to npmjs.com
 */
gulp.task('publish', ['tag'], function(done)
{
    run("npm publish").exec(done);
});
