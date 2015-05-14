var gulp = require("gulp"),
  path = require("path"),
  gutil = require("gulp-util"),
  rename = require("gulp-rename"),
  pkg = require("./package.json");

var SRC  = "app";

var SRC_CSS_BASE  = path.join(SRC,"styles");
var SRC_JAVASCRIPT_BASE  = path.join(SRC, "scripts");
var SRC_IMAGES_BASE  = path.join(SRC, "images");
var SRC_VIEWS_BASE  = path.join(SRC, "views");
var SRC_FONTS_BASE  = path.join(SRC, "fonts");

var SRC_ALL  = path.join(SRC, "**");
var SRC_HTML  = path.join(SRC, "**", "*.html");
var SRC_CSS_ALL  = path.join(SRC_CSS_BASE, "**", "*.css");
var SRC_JAVASCRIPT_ALL  = path.join(SRC_JAVASCRIPT_BASE, "**", "*.js");
var SRC_IMAGES_ALL  = path.join(SRC_IMAGES_BASE, "**", "*");
var SRC_VIEWS_ALL  = path.join(SRC_VIEWS_BASE, "**", "*.html");
var SRC_FONTS_ALL  = path.join(SRC_FONTS_BASE, "**", "*");

var DIST = "dist";
var DIST_LIB = path.join(DIST, "lib");
var DIST_ALL = path.join(DIST, "**");
var DIST_CSS = path.join(DIST, "styles");
var DIST_JAVASCRIPT = path.join(DIST, "scripts");
var DIST_IMAGES = path.join(DIST, "images");
var DIST_FONTS = path.join(DIST, "fonts");

var MAIN_SCRIPT = "app.js";
var file_number = new Date().getTime();

//CSS
function compileCss() {
  return gulp.src(SRC_CSS_ALL)
    .pipe(require("gulp-minify-css")({ paths: [ path.join(SRC_CSS_BASE, "includes") ] }))
    .pipe(require("gulp-autoprefixer")("last 2 version", "safari 5", "ie 8", "ie 9", "opera 12.1", "ios 6", "android 4"))
    .pipe(gulp.dest(DIST_CSS));
}
gulp.task("compile:css", ["clean"], function() {
  return compileCss();
});
// Minify the CSS
gulp.task("dist:css", ["clean"], function() {
  return compileCss()
    .pipe(rename({ suffix: ".min-"+file_number }))
    .pipe(require('gulp-minify-css')())
    .pipe(gulp.dest(DIST_CSS));
});

// JavaScripts
// Run JSHint on all of the app/js files and concatenate everything together
function compileJavaScript() {
  var jshint = require("gulp-jshint");
  return gulp.src(SRC_JAVASCRIPT_ALL)
    .pipe(jshint())
    .pipe(jshint.reporter(require('jshint-stylish')))
    .pipe(require("gulp-concat")(MAIN_SCRIPT))
    .pipe(gulp.dest(DIST_JAVASCRIPT));
}
gulp.task("compile:javascript", ["clean"], function() {
  return compileJavaScript();
});
// Uglify the JS
gulp.task("dist:javascript", ["clean"], function() {
  return compileJavaScript()
    .pipe(rename({ suffix: ".min-"+file_number }))
    .pipe(require('gulp-ngmin')()) // ngmin makes angular injection syntax compatible with uglify
    .pipe(require("gulp-uglify")())
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
    .pipe(require("gulp-imagemin")({ optimizationLevel: 3, progressive: true, interlaced: true }))
    .pipe(gulp.dest(DIST_IMAGES));
});

// Copy fonts folders
gulp.task("copy-fonts", ["clean"], function() {
  return gulp.src(SRC_FONTS_ALL)
    .pipe(gulp.dest(DIST_FONTS));
});


// Copy the html assets without modification
gulp.task("compile:html", ["clean"], function() {
  return gulp.src(SRC_HTML)
    .pipe(gulp.dest(DIST));
});

// Replace the non-minified paths in html assets with the minified paths
// Todo: This brute force hacky way of doing this is error prone
gulp.task("dist:html", ["clean"], function() {
  var replace = require('gulp-replace');

  return gulp.src(SRC_HTML)
      //.pipe(replace(/\.js/g, ".min.js"))
      //.pipe(replace(/\.css/g, ".min.css"))
      .pipe(replace(/(scripts\/)(.*)(.js)/g, "$1$2.min-"+file_number+".js"))
      .pipe(replace(/(styles\/)(.*)(.css)/g, "$1$2.min-"+file_number+".css"))
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
gulp.task("compile", ["copy-bower", "copy-fonts", "copy-js", "compile:html", "compile:css", "compile:javascript", "compile:images"]);

// Dist everything
gulp.task("dist", ["copy-bower", "copy-fonts", "copy-js", "dist:html", "dist:css", "dist:javascript", "dist:images"]);

// Clean the DIST dir
gulp.task("clean", function() {
  return gulp.src([DIST, ".build"], {read: false})
    .pipe(require("gulp-clean")());
});

// Updates the Bower dependencies based on the bower.json file
gulp.task("update", ["clean"], function(next) {

  var needsUpdate = false;

  gulp.src("bower.json")
    .pipe(require("gulp-newer")(".build"))
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
      require("bower").commands.install([], {}, { interactive: false })
        .on("end", function () {
          next();
        })
        .on("log", function (log) {
          if (log.level == "action" && log.id == "install") {
            gutil.log("Added Bower Dependency: " + log.message);
          }
        })
        .on("error", function (error) {
          gutil.error("Bower Error:", error);
          next(error);
        });
    })
});

//Dev with watch
gulp.task("dev", ["compile"], function() {
  gulp.watch(SRC_ALL, ["compile"]);
  //gulp.watch("bower.json", ["copy-bower"]);
});

//Prod
gulp.task("prod", ["dist"]);

// Default to prod
gulp.task("default", ["prod"]);
