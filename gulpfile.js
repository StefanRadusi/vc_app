var gulp = require('gulp');
var browserify = require('gulp-browserify');
var rename = require('gulp-rename');
var watch = require('gulp-watch');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var shell = require('gulp-shell');

// Watch for browserfy
gulp.task('scripts', function() {
    return watch(['./public/javascripts/*'], function() {
        gulp.src('./public/javascripts/*.js')
        .pipe(browserify({debug : true}))
        .pipe(gulp.dest('./public/javascripts-dist/'))
    });
});

gulp.task('style', function(){
    return watch(['./public/sass/*'], function() {
        gulp.src('./public/sass/*')
            .pipe(sourcemaps.init())
            .pipe(sass().on('error', sass.logError))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('./public/stylesheets/'));            
    });
});

gulp.task('start_db', shell.task([
  "cd C:",  
  "& 'C:\\Program Files\\MongoDB\\Server\\3.0\\bin\\mongod.exe'"
]))


//start by webstorm
gulp.task('webstorm_scripts', function() {
        gulp.src('./public/javascripts/profile.js')
            .pipe(browserify({debug : true}))
            .pipe(gulp.dest('./public/javascripts-dist/'));
});