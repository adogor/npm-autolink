const mockFs = require('mock-fs');
const utils = require('./support/utils');
const fs = require('fs-extra');
const autoLink = require('../');
const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const _ = require('lodash');
const sinon = require('sinon');
chai.use(chaiAsPromised);

const modules = {
  '/var/module1': {
    'package.json': {
      name: 'module1',
      version: '0.1.0'
    }
  },
  '/var/module2': {
    'package.json': {
      name: '@test/module2',
      version: '0.2.0'
    }
  },
  '/module3': {
    'package.json': {
      name: 'module3',
      version: '0.3.0'
    }
  },
  '/.autolink': '**/package.json'
};

//console.log(fs.readdirSync('/'));

describe('list & remove', function() {

  beforeEach(() => {
    utils.init(modules).with({
      '/moduleTmp': {
        'package.json': {
          name: 'module3',
          version: '0.3.0'
        }
      },
      '/moduleTmp2': {
        'package.json': {
          name: '@test/module2',
          version: '0.2.0'
        }
      },
      '/var/module1': {
        'package.json': {
          dependencies: {
            'module3': '0.3.0',
            '@test/module2': '*'
          }
        },
        'node_modules': {
          'module3': mockFs.symlink({
            path: '/moduleTmp'
          }),
          '@test': {
            'module2': mockFs.symlink({
              path: '/moduleTmp2'
            }),
          }
        }
      }
    }).withCwd('/var/module1').apply();
  })

  afterEach(utils.restoreFs);

  describe('listLinks', () => {
    it('must list every linked module for current module', () => {
      return expect(autoLink.listLinks()).to.eventually.deep.include.members([
        {
          path: '/var/module1/node_modules/module3',
          target: '/moduleTmp',
          version: '0.3.0'
        },
        {
          "path": "/var/module1/node_modules/@test/module2",
          "target": "/moduleTmp2",
          "version": "0.2.0"
        }
      ])
    });
  })

  describe('removeLinks', () => {
    it('must remove every linked module for current module', () => {
      return autoLink.removeLinks('module3').then(() => {
        expect(fs.readdirSync('/var/module1/node_modules')).to.have.all.members(['@test']);
        expect(fs.readdirSync('/var/module1/node_modules/@test')).to.have.all.members(['module2']);
      })
    });

    it('must remove every linked module for current module', () => {
      return autoLink.removeLinks().then(() => {
        expect(fs.readdirSync('/var/module1/node_modules')).to.have.all.members(['@test']);
        expect(fs.readdirSync('/var/module1/node_modules/@test')).to.be.empty;
      })
    });
  });
});
