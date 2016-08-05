import * as utils from './support/utils';
import fs from 'fs-extra';
import autoLink from '../';
import chai from 'chai';
const expect = chai.expect;
import chaiAsPromised from 'chai-as-promised';
import _ from 'lodash';
import Promise from 'bluebird';
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

describe('getMatches', () => {

  afterEach(utils.restoreFs);

  it('should throw an exception if no package.json could be found', () => {
    utils.mockFsWithCwd(modules, '/var/');
    return expect(autoLink.getMatches()).to.be.rejectedWith('No package.json found');
  });

  it('should return no match if nothing correspond', () => {
    utils.init(modules).with({
      '/var/module1': {
        'package.json': {
          dependencies: {
            'module4': '0.5.0'
          }
        }
      }
    }).withCwd('/var/module1').apply();
    return expect(autoLink.getMatches()).to.eventually.deep.equal([]);
  });

  describe('should find matches', () => {
    var res = [
      {
        "bin": undefined,
        "devPath": utils.convertPathToSystem("/module3"),
        "devVersion": "0.3.0",
        "name": "module3",
        "requiredRange": "0.3.0"
      }
    ];

    it('in dependencies', () => {
      utils.init(modules).with({
        '/var/module1': {
          'package.json': {
            dependencies: {
              'module3': '0.3.0'
            }
          }
        }
      }).withCwd('/var/module1').apply();
      return expect(autoLink.getMatches()).to.eventually.deep.equal(res);
    });

    it('in devDependencies', () => {
      utils.init(modules).with({
        '/var/module1': {
          'package.json': {
            devDependencies: {
              'module3': '0.3.0'
            }
          }
        }
      }).withCwd('/var/module1').apply();
      return expect(autoLink.getMatches()).to.eventually.deep.equal(res);
    });

    it('in optionalDependencies', () => {
      utils.init(modules).with({
        '/var/module1': {
          'package.json': {
            optionalDependencies: {
              'module3': '0.3.0'
            }
          }
        }
      }).withCwd('/var/module1').apply();
      return expect(autoLink.getMatches()).to.eventually.deep.equal(res);
    });
  });

  it('should accept @namespaced modules', () => {
    utils.init(modules).with({
      '/var/module1': {
        'package.json': {
          dependencies: {
            'module3': '0.3.0',
            '@test/module2': '0.2.0'
          }
        }
      }
    }).withCwd('/var/module1').apply();
    return expect(autoLink.getMatches()).to.eventually.have.lengthOf(2);
  });

  describe('should respect semver versioning', () => {
    it('with exact ranges', () => {
      utils.init(modules).with({
        '/var/module1': {
          'package.json': {
            dependencies: {
              'module3': '0.4.0'
            }
          }
        }
      }).withCwd('/var/module1').apply();
      return expect(autoLink.getMatches()).to.eventually.deep.equal([]);
    });

    it('with upper ranges (0.)', () => {
      utils.init(modules).with({
        '/var/module1': {
          'package.json': {
            dependencies: {
              'module3': '^0.1.0'
            }
          }
        }
      }).withCwd('/var/module1').apply();
      return expect(autoLink.getMatches()).to.eventually.deep.equal([]);
    });

    it('with upper ranges (1.)', () => {
      utils.init(modules).with({
        '/module3': {
          'package.json': {
            version: '1.5.0'
          }
        },
        '/var/module1': {
          'package.json': {
            dependencies: {
              'module3': '^1.0.0'
            }
          }
        }
      }).withCwd('/var/module1').apply();
      return expect(autoLink.getMatches()).to.eventually.deep.equal([
        {
          "bin": undefined,
          "devPath": utils.convertPathToSystem("/module3"),
          "devVersion": "1.5.0",
          "name": "module3",
          "requiredRange": "^1.0.0"
        }
      ]);
    });

    it('with wildcard ranges', () => {
      utils.init(modules).with({
        '/var/module1': {
          'package.json': {
            dependencies: {
              'module3': '*'
            }
          }
        }
      }).withCwd('/var/module1').apply();
      return expect(autoLink.getMatches()).to.eventually.deep.equal([{
        "bin": undefined,
        "devPath": utils.convertPathToSystem("/module3"),
        "devVersion": "0.3.0",
        "name": "module3",
        "requiredRange": "*"
      }]);
    });

    it('if multiple version matches, it should select the biggest', () => {
      utils.init(modules).with({
        '/module3b': {
          'package.json': {
            name: 'module3',
            version: '2.0.1'
          }
        },
        '/var/module1': {
          'package.json': {
            dependencies: {
              'module3': '*'
            }
          }
        }
      }).withCwd('/var/module1').apply();
      return expect(autoLink.getMatches()).to.eventually.deep.equal([{
        "bin": undefined,
        "devPath": utils.convertPathToSystem("/module3b"),
        "devVersion": "2.0.1",
        "name": "module3",
        "requiredRange": "*"
      }]);
    });
  });


});
