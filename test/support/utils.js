'use strict';
const mockFs = require('mock-fs');
const _ = require('lodash');
const os = require('os');

function transformConfig(config) {
  return _.chain(config)
    .keys()
    .sortBy()
    .reduce((res, key) => {
      var value = config[key];
      if (key === 'package.json') {
        res[key] = JSON.stringify(value);
      } else if (_.isFunction(value)) {
        res[key] = value;
      } else if (_.isObject(value)) {
        res[key] = transformConfig(value);
      } else {
        res[key] = value;
      }

      return res;
    }, {})
    .value();
}

function MockFsBuilder(config) {
  this.config = config;
  this.cwd = process.cwd();

  this.with = function(config) {
    _.merge(this.config, config);
    return this;
  }

  this.withCwd = function(cwd) {
    this.cwd = cwd;
    return this;
  }

  this.apply = function() {
    //console.log(transformConfig(this.config))
    mockFs(transformConfig(this.config), {
      createCwd: false
    });
    process.chdir(this.cwd);
    return this;
  }
}

exports.init = function(config) {
  return new MockFsBuilder(_.cloneDeep(config));
}

exports.mockFsWithCwd = function(config, cwd) {
  mockFs(config, {
    createCwd: false
  });
  process.chdir(cwd);
};

exports.restoreFs = function() {
  mockFs.restore();
}

exports.convertPathToSystem = function(filename) {
  if (os.platform() !== 'win32') {
      return filename;
  }
  return 'C:'+filename.replace(/\//g, '\\');
  }
