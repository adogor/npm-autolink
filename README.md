# npm-autolink
Npm link done right

[![Npm](https://img.shields.io/npm/v/npm-autolink.svg)](https://npmjs.org/package/npm-autolink)
[![Npm dependencies](https://img.shields.io/david/adogor/npm-autolink.svg)](https://npmjs.org/package/npm-autolink)
[![Linux Build](https://img.shields.io/travis/adogor/npm-autolink/master.svg?label=linux)](https://travis-ci.org/adogor/npm-autolink)
[![Windows Build](https://img.shields.io/appveyor/ci/adogor/npm-autolink/master.svg?label=windows)](https://ci.appveyor.com/project/adogor/npm-autolink)
[![Coverage](https://img.shields.io/coveralls/adogor/npm-autolink/master.svg)](https://coveralls.io/github/adogor/npm-autolink)


## Description
When developping multiple node modules it is cumbersome to publish one module to test it in other modules. [Npm link](https://docs.npmjs.com/cli/link) is handy in these cases but can be a bit slow (everything is installed globally) and doens't cover everything.

**Npm-autolink** come to the rescue by permitting direct links between dev folders.

Main features are :
- Define your dev node modules paths with *.autolink* files.
- Automatically create/remove/list symlinks between your node modules
- bin executables are also linked !

## Installation
```sh
npm install -g npm-autolink
```

## .autolink files
- File containing your glob patterns / paths to your package.json files
- npm-autolink will recursively look for .autolink files in your parent folders
- One line per pattern
- Glob patterns are relatives to .autolink dir

### Example *.autolink* file:
```
dev/*/package.json
dev/bigproject/*/package.json
```

### Scan everything :
```
**/package.json
```

**Note :** *node_modules* and *bower_components* folders are never scanned.

## Usage

`npm-autolink [command] [options]`

Print usage information
```sh
$ npm-autolink -h
$ npm-autolink --help
```

List available dev packages
```sh
$ npm-autolink list
```

Display current module links
```sh
$ npm-autolink
```

List packages matches that can be linked
```sh
$ npm-autolink matches
```

Link node modules. Optional [id]
```sh
$ npm-autolink link [id]
```

Remove symlinks. Optional [id]
```sh
$ npm-autolink remove [id]
```

## What if multiple versions of same module are found ?
npm-autolink will respect package.json version ranges and if multiple candidates it will select the most recent version.
