import * as utils from './support/utils';
import fs from 'fs-extra';
import autoLink from '../src/';
import chai from 'chai';
const expect = chai.expect;
import chaiAsPromised from 'chai-as-promised';
import _ from 'lodash';
import { EOL as endOfLine } from 'os';
import Promise from 'bluebird';
chai.use(chaiAsPromised);

const modules = {
  '/var/module1': {
    'package.json': JSON.stringify({
      name: 'module1',
      version: '0.1.0'
    })
  },
  '/var/module2': {
    'package.json': JSON.stringify({
      name: '@test/module2',
      version: '0.2.0'
    })
  },
  '/module3': {
    'package.json': JSON.stringify({
      name: 'module3',
      version: '0.3.0'
    })
  }
}

describe('GetDevPackages', () => {

  afterEach(utils.restoreFs);

  it('should throw an exception if no .autolink could be found', () => {
    return expect(autoLink.getDevPackage()).to.be.rejectedWith('No .autolink file could be found');
  });

  it('should load the .autoconfig in the current directory', () => {
    utils.init(modules).with({
      '/var/': {
        '.autolink': ''
      }
    }).withCwd('/var/').apply();
    return expect(autoLink.getDevPackage()).to.eventually.deep.equal({});
  });

  it('should scan single entry', () => {
    utils.mockFsWithCwd(_.assign({
      '/var/': {
        '.autolink': 'module1/package.json'
      }
    }, modules), '/var/');
    return expect(autoLink.getDevPackage()).to.eventually.deep.equal({
      "module1": {
        "0.1.0": {
          "package": {
            "name": "module1",
            "version": "0.1.0"
          },
          "path": utils.convertPathToSystem("/var/module1")
        }
      }
    });
  });

  it('should scan multiple entries', () => {
    utils.mockFsWithCwd(_.assign({
      '/var/': {
        '.autolink': 'module1/package.json' + endOfLine + 'module2/package.json'
      }
    }, modules), '/var/');
    return expect(autoLink.getDevPackage()).to.eventually.deep.equal({
      "module1": {
        "0.1.0": {
          "package": {
            "name": "module1",
            "version": "0.1.0"
          },
          "path": utils.convertPathToSystem("/var/module1")
        }
      },
      "@test/module2": {
        "0.2.0": {
          "package": {
            "name": "@test/module2",
            "version": "0.2.0"
          },
          "path": utils.convertPathToSystem("/var/module2")
        }
      }
    });
  });

  it('should support glob patterns', () => {
    utils.mockFsWithCwd(_.assign({
      '/var/': {
        '.autolink': '*/package.json'
      }
    }, modules), '/var/');
    return expect(autoLink.getDevPackage()).to.eventually.have.all.keys('module1', '@test/module2');
  });

  it('should support absolute paths', () => {
    utils.mockFsWithCwd(_.assign({
      '/var/': {
        '.autolink': '/module3/package.json'
      }
    }, modules), '/var/');
    return expect(autoLink.getDevPackage()).to.eventually.have.all.keys('module3');
  });

  it('should read .autolink files in parent directories', () => {
    utils.mockFsWithCwd(_.assign({
      '/.autolink': '**/package.json'
    }, modules), '/var/');
    return expect(autoLink.getDevPackage()).to.eventually.have.all.keys('module1', '@test/module2', 'module3');
  });

  it('and combine every .autolink', () => {
    utils.mockFsWithCwd(_.assign({
      '/.autolink': 'module3/package.json',
      '/var/.autolink': '*/package.json'
    }, modules), '/var/');
    return expect(autoLink.getDevPackage()).to.eventually.have.all.keys('module1', '@test/module2', 'module3');
  });

  it('If multiple .autolink overlaps, it should not be a problem', () => {
    utils.mockFsWithCwd(_.assign({
      '/.autolink': '**/package.json',
      '/var/.autolink': '*/package.json'
    }, modules), '/var/');
    return expect(autoLink.getDevPackage()).to.eventually.have.all.keys('module1', '@test/module2', 'module3');
  });

  it('A module can be found in multiple versions', () => {
    utils.mockFsWithCwd(_.assign({
      '/var/.autolink': '*/package.json'
    }, modules, {
      '/var/module2b': {
        'package.json': JSON.stringify({
          name: '@test/module2',
          version: '0.3.0'
        })
      }
    }), '/var/');
    const promise = autoLink.getDevPackage();
    return Promise.all([expect(promise).to.eventually.have.all.keys('module1', '@test/module2'),
      promise.then((packages) => expect(packages['@test/module2']).to.have.all.keys('0.2.0', '0.3.0'))
    ]);
  });

  it('A module can\'t be found the same version multiple times (case 1)', () => {
    utils.mockFsWithCwd(_.assign({
      '/var/.autolink': '*/package.json'
    }, modules, {
      '/var/module2b': {
        'package.json': JSON.stringify({
          name: '@test/module2',
          version: '0.2.0'
        })
      }
    }), '/var/');
    //FIXME : we should remove the conflicted module.
    return expect(autoLink.getDevPackage()).to.eventually.have.all.keys('module1', '@test/module2');
  });

  it('A module can\'t be found the same version multiple times (case 2)', () => {
    utils.mockFsWithCwd(_.assign({
      '/var/.autolink': '*/package.json',
      '/.autolink': '*/package.json'
    }, modules, {
      '/module2b': {
        'package.json': JSON.stringify({
          name: '@test/module2',
          version: '0.2.0'
        })
      }
    }), '/var/');
    //FIXME : we should remove the conflicted module.
    return expect(autoLink.getDevPackage()).to.eventually.have.all.keys('module1', '@test/module2', 'module3');
  });
});
