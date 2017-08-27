const del = require('del');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const gulpBabel = require('gulp-babel');
const PolymerProject = require('polymer-build').PolymerProject;
const HtmlSplitter = require('polymer-build').HtmlSplitter;
const addServiceWorker = require('polymer-build').addServiceWorker;
const forkStream = require('polymer-build').forkStream;
const mergeStream = require('merge-stream');
const babelCore = require('babel-core');
const babelPresetES2015 = require('babel-preset-es2015');
const babelPresetES2016 = require('babel-preset-es2016');
const babelPresetES2017 = require('babel-preset-es2017');
const htmlMin = require('gulp-htmlmin');
const autoprefixer = require('autoprefixer');
const posthtml = require('gulp-posthtml');
const posthtmlcss = require('posthtml-postcss');

const polymerJson = require('./polymer.json');
const swPrecacheConfig = require('./sw-precache-config.js');
const project = new PolymerProject(polymerJson);

const config = {

  // Output directory
  directory: 'build',

  // Set true to bundle files
  bundle: true,

  // Babel config for compiling JS
  babel: {
    presets: [
      babelPresetES2015.buildPreset({}, {modules: false}),
      'es2016',
      'es2017'
    ]
  },

  // Babili config for minifying JS
  babili: {
    presets: [ "babili" ]
  },

  // htmlMin config for minifying HTML and inline styles
  htmlMin: {
    collapseWhitespace: true, 
    removeComments: true,
    customAttrAssign: [{"source":"\\$="}],
    customAttrSurround: [
      [ {"source": "\\({\\{"}, {"source": "\\}\\}"} ],
      [ {"source": "\\[\\["}, {"source": "\\]\\]"}  ]
    ],
    minifyCSS: true,
  },

  // Autoprefix CSS using postHTML
  posthtmlPlugins: [
    posthtmlcss(autoprefixer({
      browsers: [
        'last 2 versions',
        'ie >= 10'
      ],
      cascade: false
    }), {}, /^text\/css$/)
  ],

};

/**
 * Waits for the given ReadableStream
 */
function waitFor(stream) {
  return new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });
}

async function build() {

  console.log('Deleting contents of build dir...');
  await del([`${config.directory}/**`]);

  console.log('Optimizing sources...');
  const sourcesHtmlSplitter = new HtmlSplitter();
  const sourcesStream = project.sources()
    .pipe(sourcesHtmlSplitter.split())
    // Run autoprixer in postCSS through postHTML
    .pipe(gulpif(/\.html$/, posthtml(config.posthtmlPlugins)))
    // Compile ES7 down to ES5
    .pipe(gulpif(/^((?!webcomponentsjs|browser-polyfill).)*\.js$/, gulpBabel(config.babel)))
    // Minify JS files
    .pipe(gulpif(/^((?!browser-polyfill).)*\.js$/, gulpBabel(config.babili)))
    // Minify HTML and inline styles
    .pipe(gulpif(/\.html$/, htmlMin(config.htmlMin)))
    .pipe(sourcesHtmlSplitter.rejoin());

  console.log('Optimizing dependencies...');
  const dependenciesHtmlSplitter = new HtmlSplitter();
  const dependenciesStream = project.dependencies()
    .pipe(dependenciesHtmlSplitter.split())
    // Run autoprixer in postCSS through postHTML
    .pipe(gulpif(/\.html$/, posthtml(config.posthtmlPlugins)))
    // Compile ES7 down to ES5
    .pipe(gulpif(/^((?!webcomponentsjs|browser-polyfill).)*\.js$/, gulpBabel(config.babel)))
    // Minify JS files
    .pipe(gulpif(/^((?!browser-polyfill).)*\.js$/, gulpBabel(config.babili)))
    // Minify HTML and inline styles
    .pipe(gulpif(/\.html$/, htmlMin(config.htmlMin)))
    .pipe(dependenciesHtmlSplitter.rejoin());

  console.log('Creating build stream...');
  let buildStream = mergeStream(sourcesStream, dependenciesStream);

  console.log('Adding ES5 adapters...');
  buildStream = buildStream.pipe(project.addBabelHelpersInEntrypoint());
  buildStream = buildStream.pipe(project.addCustomElementsEs5Adapter());

  if (config.bundle) {
    console.log('Bundling output...');
    buildStream = buildStream.pipe(project.bundler());
  }

  console.log('Generating push manifest...');
  buildStream = buildStream.pipe(project.addPushManifest())
  
  console.log('Building files...');
  buildStream = buildStream.pipe(gulp.dest(config.directory));
  await waitFor(buildStream);

  console.log('Generating service worker...');
  await addServiceWorker({
    buildRoot: config.directory,
    bundled: config.bundle,
    project: project,
    swPrecacheConfig: swPrecacheConfig
  });

  console.log('Success!');
  return Promise.resolve();

};

gulp.task('build', build);