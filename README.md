# npm-autolink

Npm link done right

[![Npm](https://img.shields.io/npm/v/npm-autolink.svg)](https://npmjs.org/package/npm-autolink)
[![Npm dependencies](https://img.shields.io/david/adogor/npm-autolink.svg)](https://npmjs.org/package/npm-autolink)
[![Linux Build](https://img.shields.io/travis/adogor/npm-autolink/master.svg?label=linux)](https://travis-ci.org/adogor/npm-autolink)
[![Windows Build](https://img.shields.io/appveyor/ci/adogor/npm-autolink/master.svg?label=windows)](https://ci.appveyor.com/project/adogor/npm-autolink)
[![Coverage](https://img.shields.io/coveralls/adogor/npm-autolink/master.svg)](https://coveralls.io/github/adogor/npm-autolink)

## Description

When developping multiple node modules it is cumbersome to publish one module to test it in other modules. [Npm link](https://docs.npmjs.com/cli/link) is handy in these cases but can be a bit slow (everything is installed globally) and doesn't cover everything.

**Npm-autolink** come to the rescue by permitting direct links between dev folders.

Main features are :

- Define your workspace modules links in _autolink.json_ file.
- Automatically link or unlink all projects at once
- bin executables are also linked !

## Breaking change in v1

V1 of npm-autolink works very differently than v0 :

- only one conf file is loaded `autolink.json`
- you can link and unlink many projects at the same time

> Tests are coming ...

## Installation

```sh
npm install -g npm-autolink
```

## autolink.json file

- describe linked projects in your workspace
- `npm link` will only link those projects

### Example _autolink.json_ file:

```
{
  "link": {
    "@iamasoft/project1": ["@iamasoft/lib1"],
    "@iamasoft/lib1": ["@iamasoft/lib2"],
  }
}
```

**Note :** _node_modules_ and _bower_components_ folders are never scanned.

## Usage

`npmauto [command] [options]`

Print usage information

```sh
$ npmauto -h
$ npmauto --help
```

List all detected packages in workspace and their states

```sh
$ npmauto ls
```

Link all

```sh
$ npmauto link
```

Unkink all

```sh
$ npmauto unlink
```
