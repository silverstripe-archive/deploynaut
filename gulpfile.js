var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sass = require('gulp-sass');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');

var path = {
	JS: 'js/*.js*',
	DEST: './static/'
};

var onError = function (err) {
	// do a terminal beep on error
	gutil.beep();
	console.log(err);
};

gulp.task('sass', function () {
	gulp.src('sass/*.sass')
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest(path.DEST));
});

// Rerun when files changes
gulp.task('watch', function () {
	gulp.watch('./sass/*.sass', ['sass']);
	gulp.watch(path.JS, ['js-debug', 'js']);
});

// the default task just compiles all the things
gulp.task('default', ['sass']);
