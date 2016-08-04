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

describe('linkModules', function() {

  afterEach(utils.restoreFs);

  it('should accept an optional moduleName argument to link', () => {
    utils.init(modules).with({
      '/var/module1': {
        'package.json': {
          dependencies: {
            'module3': '0.3.0',
            '@test/module2': '*'
          }
        }
      }
    }).withCwd('/var/module1').apply();

    return autoLink.linkModules('module3').then(() => {
      expect(fs.readdirSync('/var/module1/node_modules')).to.have.all.members(['module3']);

      var stats = fs.lstatSync('/var/module1/node_modules/module3');
      expect(stats.isSymbolicLink()).to.be.true;
      expect(fs.readlinkSync('/var/module1/node_modules/module3')).to.equal('/module3')
    });
  });

  it('if no moduleName is provided it should link all modules', () => {
    utils.init(modules).with({
      '/var/module1': {
        'package.json': {
          dependencies: {
            'module3': '0.3.0',
            '@test/module2': '*'
          }
        }
      }
    }).withCwd('/var/module1').apply();

    return autoLink.linkModules().then(() => {
      expect(fs.readdirSync('/var/module1/node_modules')).to.have.all.members(['module3', '@test']);
    });
  });

  describe('if linked module was already installed', () => {
    it('it should be rename with a .bak', () => {
      utils.init(modules).with({
        '/var/module1': {
          'package.json': {
            dependencies: {
              'module3': '0.3.0'
            }
          },
          'node_modules': {
            'module3': {
              'package.json': {
                'name': 'module3'
              }
            }
          }
        }
      }).withCwd('/var/module1').apply();
      return autoLink.linkModules('module3').then(() => {
        expect(fs.readdirSync('/var/module1/node_modules')).to.have.all.members(['module3', 'module3.bak']);
      });
    });

    it('if the .bak extension already exists it should be replaced', () => {
      utils.init(modules).with({
        '/var/module1': {
          'package.json': {
            dependencies: {
              'module3': '0.3.0'
            }
          },
          'node_modules': {
            'module3': {
              'package.json': {
                'name': 'module3',
                'version': '0.2.0'
              }
            },
            'module3.bak': {
              'package.json': {
                'name': 'module3',
                'version': '0.1.0'
              }
            }
          }
        }
      }).withCwd('/var/module1').apply();
      return autoLink.linkModules('module3').then(() => {
        expect(fs.readJsonSync('/var/module1/node_modules/module3.bak/package.json')).to.have.property('version', '0.2.0')
      });
    });
  });

  it('if the module was already linked, the link should be replaced', () => {
    utils.init(modules).with({
      '/moduleTmp': {
        'package.json': {
          'name': 'module3',
          'version': '0.5.0'
        }
      },
      '/var/module1': {
        'package.json': {
          dependencies: {
            'module3': '0.3.0'
          }
        },
        'node_modules': {
          'module3': mockFs.symlink({
            path: '/moduleTmp'
          })
        }
      }
    }).withCwd('/var/module1').apply();
    expect(fs.readJsonSync('/var/module1/node_modules/module3/package.json')).to.have.property('version', '0.5.0');
    return autoLink.linkModules('module3').then(() => {
      expect(fs.readdirSync('/var/module1/node_modules')).to.have.all.members(['module3']);
      expect(fs.readJsonSync('/var/module1/node_modules/module3/package.json')).to.have.property('version', '0.3.0');
    });
  });

  it('if the required module have bin executable they must be linked also', () => {
    utils.init(modules).with({
      '/module3': {
        'package.json': {
          'bin': {
            'exec1': 'exec1.sh'
          }
        },
        'exec1.sh': 'my script'
      },
      '/var/module1': {
        'package.json': {
          dependencies: {
            'module3': '0.3.0'
          }
        }
      }
    }).withCwd('/var/module1').apply();

    return autoLink.linkModules('module3').then(() => {
      expect(fs.readdirSync('/var/module1/node_modules/.bin')).to.have.all.members(['exec1']);
      expect(fs.readFileSync('/var/module1/node_modules/.bin/exec1').toString()).to.equal('my script')
    });
  });


});
