'use strict';
import mockFs from 'mock-fs';
import _ from 'lodash';
import os from 'os';

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

class MockFsBuilder {
  constructor(config) {
    this.config = config;
    this.cwd = process.cwd();
  }

  with(config) {
    _.merge(this.config, config);
    return this;
  }

  withCwd(cwd) {
    this.cwd = cwd;
    return this;
  }

  apply() {
    mockFs(transformConfig(this.config), {
      createCwd: false
    });
    process.chdir(this.cwd);
    return this;
  }
}

export function init(config) {
  return new MockFsBuilder(_.cloneDeep(config));
}

export function mockFsWithCwd(config, cwd) {
  mockFs(config, {
    createCwd: false
  });
  process.chdir(cwd);
}

export function restoreFs() {
  mockFs.restore();
}

export function convertPathToSystem(filename) {
  if (os.platform() !== 'win32') {
    return filename;
  }
  return 'C:' + filename.replace(/\//g, '\\');
}
