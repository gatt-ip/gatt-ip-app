var gulp = require("gulp"),
	path = require("path"),
	gutil = require("gulp-util"),
	rename = require("gulp-rename"),
	concat = require("gulp-concat"),
	minifycss = require("gulp-cssnano"),
	sourcemaps = require('gulp-sourcemaps');
	autoprefixer = require("gulp-autoprefixer"),
	jshint = require("gulp-jshint"),
	stylish = require('jshint-stylish'),
	ngmin = require('gulp-ng-annotate'),
	uglify = require("gulp-uglify"),
	imagemin = require("gulp-imagemin"),
	replace = require('gulp-replace'),
	clean = require("gulp-rimraf"),
	newer = require("gulp-newer"),
	inject = require('gulp-inject'),
	insert = require('gulp-insert'),	
	stripDebug = require('gulp-strip-debug'),
	bower = require("bower"),
	pkg = require("./package.json");

var SRC = "app";

var SRC_CSS_BASE = path.join(SRC, "styles");
var SRC_JAVASCRIPT_BASE = path.join(SRC, "scripts");
var SRC_IMAGES_BASE = path.join(SRC, "images");
var SRC_VIEWS_BASE = path.join(SRC, "views");
var SRC_FONTS_BASE = path.join(SRC, "fonts");
var SRC_GATTIP_LIB = path.join(SRC, "lib/gatt-ip-js");
var SRC_GATTIP = path.join(SRC, "lib/gatt-ip-js/dist/");

var SRC_ALL = path.join(SRC, "**");
var SRC_HTML = path.join(SRC, "**", "*.html");
var SRC_CSS_ALL = path.join(SRC_CSS_BASE, "**", "*.css");
var SRC_JAVASCRIPT_ALL = path.join(SRC_JAVASCRIPT_BASE, "**", "*.js");
var SRC_IMAGES_ALL = path.join(SRC_IMAGES_BASE, "**", "*");
var SRC_VIEWS_ALL = path.join(SRC_VIEWS_BASE, "**", "*.html");
var SRC_FONTS_ALL = path.join(SRC_FONTS_BASE, "**", "*");
var SRC_GATTIP_LIB_JS = path.join(SRC_GATTIP_LIB, "**", "*.js");

var SRC_INDEX_HTML = path.join(SRC, 'index.html');


var DIST = "dist";
var DIST_LIB = path.join(DIST, "lib");
var DIST_ALL = path.join(DIST, "**");
var DIST_CSS = path.join(DIST, "styles");
var DIST_JAVASCRIPT = path.join(DIST, "scripts");
var DIST_IMAGES = path.join(DIST, "images");
var DIST_FONTS = path.join(DIST, "fonts");
var DIST_GATTIP_LIB = path.join(DIST_LIB, "gatt-ip-js");

var MAIN_SCRIPT = "app.js";

var DIST_INDEX_HTML = path.join(DIST, 'index.html');


var file_number = new Date().getTime();

//CSS
function compileCss() {
	return gulp.src(SRC_CSS_ALL)
		.pipe(minifycss({
			paths: [path.join(SRC_CSS_BASE, "includes")]
		}))
		.pipe(autoprefixer("last 2 version", "safari 5", "ie 8", "ie 9", "opera 12.1", "ios 6", "android 4"))
		.pipe(gulp.dest(DIST_CSS));
}
gulp.task("compile:css", ["clean"], function() {
	return compileCss();
});

// Minify the CSS
gulp.task("dist:css", ["clean"], function() {
	return compileCss()
		.pipe(rename({
			suffix: ".min-" + file_number
		}))
		.pipe(minifycss())
		.pipe(gulp.dest(DIST_CSS));
});

// JavaScripts
// Run JSHint on all of the app/js files and concatenate everything together
function compileJavaScript() {
	return gulp.src(SRC_JAVASCRIPT_ALL)
		.pipe(jshint())
		.pipe(jshint.reporter(stylish))
		.pipe(concat(MAIN_SCRIPT))
		.pipe(gulp.dest(DIST_JAVASCRIPT));
}

gulp.task("compile:javascript", ["clean"], function() {
	return compileJavaScript();
});

// Uglify the JS
gulp.task("dist:javascript", ["clean"], function() {
	return compileJavaScript()
		.pipe(rename({
			suffix: ".min-" + file_number
		}))
		.pipe(ngmin()) // ngmin makes angular injection syntax compatible with uglify
		.pipe(uglify().on('error', gutil.log))
		.pipe(gulp.dest(DIST_JAVASCRIPT));
});

// Images
gulp.task("compile:images", ["clean"], function() {
	return gulp.src(SRC_IMAGES_ALL)
		.pipe(gulp.dest(DIST_IMAGES));
});

// Compress the images
gulp.task("dist:images", ["clean"], function() {
	return gulp.src(SRC_IMAGES_ALL)
		.pipe(imagemin({
			optimizationLevel: 3,
			progressive: true,
			interlaced: true
		}))
		.pipe(gulp.dest(DIST_IMAGES));
});

// Copy fonts folders
gulp.task("copy-fonts", ["clean"], function() {
	return gulp.src(SRC_FONTS_ALL)
		.pipe(gulp.dest(DIST_FONTS));
});

// Copy gatt-ip-js folders
gulp.task("copy-gattip", function() {
	return gulp.src(SRC_GATTIP_LIB_JS)
		.pipe(gulp.dest(DIST_GATTIP_LIB));
});

// Minify gatt-ip-js files
gulp.task("gattip-minify", function() {
	return gulp.src('./app/lib/gatt-ip-js/dist/gattip.js')
		.pipe(stripDebug())
		.pipe(rename({ suffix: ".min-"+file_number}))
		.pipe(ngmin())
		.pipe(uglify())
		.pipe(gulp.dest('./dist/lib/gatt-ip-js/dist/'));
});

// Copy the html assets without modification
gulp.task("compile:html", ["clean"], function() {
	return gulp.src(SRC_HTML)
		.pipe(gulp.dest(DIST));
});

// Copy the AppIcon without modification
gulp.task("dist:appIcon", ["clean"], function() {
	return gulp.src("app/app-icon.png")
		.pipe(gulp.dest("dist/"));
});

// Replace the non-minified paths in html assets with the minified paths
// Todo: This brute force hacky way of doing this is error prone
gulp.task("dist:html", ["clean"], function() {
	return gulp.src(SRC_HTML)
		//.pipe(replace(/\.js/g, ".min.js"))
		//.pipe(replace(/\.css/g, ".min.css"))
		.pipe(replace(/(scripts\/)(.*)(.js)/g, "$1$2.min-" + file_number + ".js"))
		.pipe(replace(/(styles\/)(.*)(.css)/g, "$1$2.min-" + file_number + ".css"))
		.pipe(replace(/(lib\/gatt-ip-js\/dist\/)(.*)(.js)/g, "$1$2.min-" + file_number + ".js"))
		.pipe(gulp.dest(DIST));
});

// Copy Bower assets
gulp.task("copy-bower", ["update"], function() {
	return gulp.src("bower_components/**")
		.pipe(gulp.dest(DIST_LIB));
});
gulp.task("copy-js", ["clean"], function() {
	return gulp.src("app/*.js")
		.pipe(gulp.dest(DIST));
});

// Compile everything
gulp.task("compile", ["copy-bower", "copy-fonts", "copy-gattip", "copy-js", "dist:appIcon", "compile:html", "compile:css", "compile:javascript", "compile:images"]);

// Dist everything
gulp.task("dist", ["copy-bower", "copy-fonts", "copy-gattip", "gattip-minify", "copy-js", "dist:appIcon", "dist:html", "dist:css", "dist:javascript", "dist:images"]);

// Clean the DIST dir
gulp.task("clean", function() {
	return gulp.src([DIST, ".build"], {
			read: false
		})
		.pipe(clean());
});

// Updates the Bower dependencies based on the bower.json file
gulp.task("update", ["clean"], function(next) {

	var needsUpdate = false;

	gulp.src("bower.json")
		.pipe(newer(".build"))
		.pipe(gulp.dest(".build")) // todo: don't do this if the bower install fails
		.on("close", function() {
			if (!needsUpdate) {
				next();
			}
		})
		.on("error", function(error) {
			if (!needsUpdate) {
				next(error);
			}
		})
		.on("data", function() {
			// updated bower.json
			needsUpdate = true;
			bower.commands.install([], {}, {
					interactive: false
				})
				.on("end", function() {
					next();
				})
				.on("log", function(log) {
					if (log.level == "action" && log.id == "install") {
						gutil.log("Added Bower Dependency: " + log.message);
					}
				})
				.on("error", function(error) {
					gutil.error("Bower Error:", error);
					next(error);
				});
		})
});

//Dev with watch
gulp.task("dev", ["clean", "compile"], function() {
	gulp.watch(SRC_ALL, ["compile"]);
});

//Prod
gulp.task("prod", ["dist"]);

// Default to prod
gulp.task("default", ["prod"]);

