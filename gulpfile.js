const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;
const clean = require('gulp-clean');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const csslint = require('gulp-csslint');
const autoPrefixer = require('gulp-autoprefixer');
const runSequence = require('run-sequence');
//if node version is lower than v.0.1.2
require('es6-promise').polyfill();
const cssComb = require('gulp-csscomb');
const cmq = require('gulp-merge-media-queries');
const cleanCss = require('gulp-clean-css');
const jshint = require('gulp-jshint');
const browserify = require('gulp-browserify');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const pug = require('gulp-pug');
const minifyHtml = require('gulp-minify-html');
const imageMin = require('gulp-imagemin');
const cache = require('gulp-cache');
const argv = require('yargs').argv;
const fs = require('fs');
const yaml = require('js-yaml');
const gulpif = require('gulp-if');
const _ = require('lodash');

var config = {
  environment: argv.environment || 'local',
  paths: {
    src: './src',
    dist: './dist', 
    data: './src/data',
    templates: './src/templates',
    srcImages: './src/assets/images',
    srcStyles: './src/assets/styles',
    srcScripts: './src/assets/scripts',
    distImages: './dist/assets/images',
    distStyles: './dist/assets/styles',
    distScripts: './dist/assets/scripts'
  },
  defaultPort: 3000,
  minify: argv.minify || false
}

var readYamlFile = (file) => {
  var dataFile = config.paths.data + file;
  return fs.existsSync(dataFile) ? yaml.safeLoad(fs.readFileSync(dataFile, 'utf8')) : {};
};


// Clean up output directory
gulp.task('clean', () => {
  return gulp.src(config.paths.dist+ '/*', {read: false})
    .pipe(clean());
});


gulp.task('styles', ()=> {

    gulp.src([config.paths.srcStyles  + '/main.scss'])
        .pipe(plumber({
            handleError: function (err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(sourcemaps.init())
        .pipe(sass({
            includePaths: [
              require('node-bourbon').includePaths, 
              require('node-neat').includePaths
            ]
        }))
        .pipe(autoPrefixer())
        .pipe(cssComb())
        .pipe(cmq({log:true}))
        .pipe(csslint())
        // .pipe(csslint.reporter())
        .pipe(gulp.dest(config.paths.distStyles))
        .pipe(gulpif(config.minify, rename({
            suffix: '.min'
        })))
        .pipe(gulpif(config.minify, cleanCss()))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(config.paths.distStyles))
        .pipe(reload({stream:true}))
});



gulp.task('scripts',()=> {
    gulp.src([config.paths.srcScripts + '/**/*.js'])
        .pipe(plumber({
            handleError: function (err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(concat('main.js'))
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(browserify())
        .pipe(gulp.dest(config.paths.distScripts))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(uglify())
        .pipe(gulp.dest(config.paths.distScripts))
        .pipe(reload({stream:true}))
});



gulp.task('templates', ()=> {

    var data = readYamlFile('/global.yaml');
    var nextGig;
    if (Object.keys(data.gigs).length) {
      data.nextGig = _.last(data.gigs);
    }
    var templateData = Object.assign(config, data);
    //console.log(data);
    gulp.src([config.paths.templates + '/pages/**/*.pug'])
        .pipe(plumber({
            handleError: function (err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(pug({pretty: true, data: templateData}))
        .pipe(gulpif(config.minify, minifyHtml()))
        .pipe(gulp.dest(config.paths.dist))
        .pipe(reload({stream:true}))
});


gulp.task('images', ()=> {
    gulp.src([config.paths.srcImages + '/**/*'])
        .pipe(plumber({
            handleError: function (err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(cache(imageMin()))
        .pipe(gulp.dest(config.paths.distImages))
        .pipe(reload({stream:true}))
});


gulp.task('watch', ()=> {
  browserSync.init({
      port: config.defaultPort,
      server: config.paths.dist
  });
  gulp.watch(config.paths.srcScripts + '/**/*.js',['scripts']);
  gulp.watch(config.paths.srcStyles + '/**/*.scss',['styles']);
  gulp.watch([config.paths.templates + '/**/*.pug', config.paths.data + '/**/*.yaml'],['templates']);
  gulp.watch(config.paths.srcImages + '/**/*',['images']);
});


gulp.task('dev', (cb) => {
    runSequence(
      'default',
      'watch',
      cb
    );
});


gulp.task('default', (cb) => {
    runSequence(
      'clean',
      ['styles', 'scripts', 'templates', 'images'],
      cb
    );
});
