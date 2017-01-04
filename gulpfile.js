/**
 * Created by stef on 12/31/2016.
 */
var gulp = require('gulp');
var browserify = require('gulp-browserify');
var rename = require('gulp-rename');
var watch = require('gulp-watch');

// Watch for browserfy
gulp.task('scripts', function() {
    return watch(['./public/javascripts/main.js', './public/javascripts/holidayConfig.js'], function() {
        gulp.src('./public/javascripts/main.js')
        .pipe(browserify({debug : true}))
        .pipe(rename('bundle.js'))
        .pipe(gulp.dest('./public/javascripts/'))
    });
});