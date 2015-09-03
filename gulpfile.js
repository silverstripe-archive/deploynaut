var gulp = require('gulp');
var sass = require('gulp-sass');
var react = require('gulp-react');
var plumber = require('gulp-plumber');
var gutil = require('gulp-util');


var onError = function (err) {
	// do a terminal beep on error
	gutil.beep();
	console.log(err);
};

gulp.task('jsx', function () {
	return gulp.src('./jsx/*.jsx')
		.pipe(plumber({ errorHandler: onError }))
		.pipe(react())
		.pipe(gulp.dest('javascript'));
});

gulp.task('sass', function () {
	gulp.src('./sass/*.sass')
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest('./css'));
});

// Rerun when files changes
gulp.task('watch', function () {
	gulp.watch('./jsx/*.jsx', ['jsx']);
	gulp.watch('./sass/*.sass', ['sass']);
});
