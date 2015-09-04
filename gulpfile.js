var gulp = require('gulp');
var sass = require('gulp-sass');
var react = require('gulp-react');
var plumber = require('gulp-plumber');
var gutil = require('gulp-util');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

var path = {
	JS: ['jsx/*.js', 'jsx/*.jsx'],
	MINIFIED_SRC: 'deploy.min.js',
	DEST_SRC: './javascript/'
};

var onError = function (err) {
	// do a terminal beep on error
	gutil.beep();
	console.log(err);
};

gulp.task('jsx', function () {
	gulp.src(path.JS)
		.pipe(plumber({ errorHandler: onError }))
		.pipe(react())
		.pipe(sourcemaps.init())
		.pipe(concat(path.MINIFIED_SRC))
		.pipe(uglify())
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(path.DEST_SRC));
});

gulp.task('sass', function () {
	gulp.src('./sass/*.sass')
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest('./css'));
});

// Rerun when files changes
gulp.task('watch', function () {
	gulp.watch(path.JS, ['jsx']);
	gulp.watch('./sass/*.sass', ['sass']);
});
