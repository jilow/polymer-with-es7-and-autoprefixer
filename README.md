# Polymer with ES7 and autoprefixer

This example shows how to:

- Develop with ES7 syntax `(async / await)` which is compiled down to ES5 on build.

- Write CSS without vendor prefixes which is autoprefixed on build.

Checkout the `gulpfile.js` for details.

### Setup

#### Prerequisites

First, install [Polymer CLI](https://github.com/Polymer/polymer-cli) using [npm](https://www.npmjs.com) (we assume you have pre-installed [node.js](https://nodejs.org)).
```bash
npm install -g polymer-cli
```

Second, install [Bower](https://bower.io/) using [npm](https://www.npmjs.com)
```bash
npm install -g bower
```

#### Dependancies

Install dependancies
```bash
npm install && bower update
```

### Serve

Serve the source files
```bash
npm run serve
```

### Build

Build from source files
```bash
npm run build
```

Serve the build files
```bash
npm run serve:build
```