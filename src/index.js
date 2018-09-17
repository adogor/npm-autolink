'use strict';

var Promise = require('bluebird');
Promise.longStackTraces();
var fs = require('fs-extra');
var path = require('path');
var glob = Promise.promisify(require('glob'));
var endOfLine = require('os').EOL;
var _ = require('lodash');
var pathIsAbsolute = require('path-is-absolute');
var semver = require('semver');
var chalk = require('chalk');

const AUTOLINK_FILE_NAME = 'autolink.json';

function AutoLinkNotFound() {}
AutoLinkNotFound.prototype = Object.create(Error.prototype);

function getNodeModulesPath() {
  return path.join(process.cwd(), 'node_modules');
}

/**
 * Find the first autolink.json file, starting from process.cwd()
 */
async function getFirstNpmAutoLinkFile() {
  let currentDir = process.cwd();
  let foundPath = null;
  let oldDir = null;

  var promises = [];
  do {
    const autoLinkPath = path.join(currentDir, AUTOLINK_FILE_NAME);
    const fileExists = await fs.pathExists(autoLinkPath);
    if (fileExists) {
      return autoLinkPath;
    }
    oldDir = currentDir;
    currentDir = path.dirname(currentDir);
  } while (currentDir !== oldDir);
  return null;
}

function getAutolinkContent(filePath) {
  return require(filePath);
}

async function link() {
  const filePath = await getFirstNpmAutoLinkFile();
  const fileContent = getAutolinkContent(filePath);
  if (!fileContent.link) {
    console.log('Nothing to link');
    return;
  }

  const workspaceDir = path.dirname(filePath);
  const packages = await getPackagesFromPath(workspaceDir);
  const dependencyTree = await getTree(packages, workspaceDir);

  const toLink = _.reduce(
    dependencyTree,
    (res, projectConf, projectName) => {
      const linkList = fileContent.link[projectName];
      if (linkList && projectConf.dependencies) {
        // If we have a linkList for this project && it has dependencies
        const toLinkInProject = _.reduce(
          projectConf.dependencies,
          (res2, depConf, depName) => {
            fileContent.link;
            if (linkList.includes(depName)) {
              // If dependency is in linkList
              const sourceConf = dependencyTree[depName];
              res2.push({
                source: {
                  path: path.join(workspaceDir, sourceConf.path),
                  name: depName,
                  bin: sourceConf.bin
                },
                target: {
                  path: path.join(workspaceDir, projectConf.path)
                }
              });
            }
            return res2;
          },
          []
        );
        res.push(...toLinkInProject);
      }
      return res;
    },
    []
  );

  for (let linkConf of toLink) {
    await linkModule(linkConf);
  }

  return ls();
}

async function unlink() {
  const filePath = await getFirstNpmAutoLinkFile();
  const workspaceDir = path.dirname(filePath);
  const packages = await getPackagesFromPath(workspaceDir);

  for (let projectName in packages) {
    const projectConf = packages[projectName];
    const nodeModulesPath = path.join(
      workspaceDir,
      projectConf.path,
      'node_modules'
    );
    await removeLinksInDir(nodeModulesPath);
  }

  return ls();
}

async function ls() {
  const filePath = await getFirstNpmAutoLinkFile();
  const workspaceDir = path.dirname(filePath);
  const packages = await getPackagesFromPath(workspaceDir);
  const dependencyTree = await getTree(packages, workspaceDir);
  return getWorkspaceDisplayTree(dependencyTree);
}

function getWorkspaceDisplayTree(dependencyTree) {
  return _.reduce(
    dependencyTree,
    (res, projectConf, projectName) => {
      const obj = _.reduce(
        projectConf.dependencies,
        (res2, depConf, depName) => {
          res2[depName] = `semver: ${depConf.semver}`;
          if (!depConf.version) {
            res2[depName] += ', not found';
          } else {
            if (depConf.isLink) {
              res2[depName] += `, linked: ${depConf.version} (${
                depConf.linkTarget
              })`;
            } else {
              res2[depName] += `, installed: ${depConf.version}`;
            }
          }
          return res2;
        },
        {}
      );
      const key =
        projectName === projectConf.path
          ? projectName
          : `${projectName} (${projectConf.path})`;
      res[key] = obj;
      return res;
    },
    {}
  );
}

async function getTree(packages, workspaceDir) {
  const dependencyTree = _.reduce(
    packages,
    (res, conf) => {
      const pack = conf.package;
      res[pack.name] = {
        path: conf.path,
        bin: pack.bin
      };
      res[pack.name].dependencies = _.reduce(
        { ...pack.dependencies, ...pack.devDependencies },
        (res, depVersion, depName) => {
          if (Object.keys(packages).includes(depName)) {
            res[depName] = {
              semver: depVersion
            };
          }
          return res;
        },
        {}
      );
      return res;
    },
    {}
  );

  for (let packName in dependencyTree) {
    const conf = dependencyTree[packName];
    const nodeModulesDir = path.join(workspaceDir, conf.path, 'node_modules');
    for (let depName in conf.dependencies) {
      const depInfo = conf.dependencies[depName];
      Object.assign(
        depInfo,
        await getPackageStatus(nodeModulesDir, depName, workspaceDir)
      );
    }
  }
  return dependencyTree;
}

async function getPackagesFromPath(workspaceDir) {
  const files = await glob('**/package.json', {
    cwd: workspaceDir,
    ignore: ['**/node_modules/**', '**/bower_components/**']
  });

  return files.reduce((res, file) => {
    const fileAbsolutePath = path.join(workspaceDir, file);
    const pack = require(fileAbsolutePath);
    res[pack.name] = {
      package: pack,
      path: path.dirname(file)
    };
    return res;
  }, {});
}

/**
 * source:
 *  name
 *  path
 *  bin
 * target:
 *  path
 *
 * @param {*} linkConf
 */
async function linkModule(linkConf) {
  var scopeMatch = linkConf.source.name.match(/^(@.*)\/.*/);
  var scope;
  if (!!scopeMatch) {
    scope = scopeMatch[1];
  }
  const nodeModulesPath = path.join(linkConf.target.path, 'node_modules');
  var scopedPath = scope ? path.join(nodeModulesPath, scope) : nodeModulesPath;
  var targetPath = path.join(nodeModulesPath, linkConf.source.name);
  var binPath = path.join(nodeModulesPath, '.bin');
  var sourcePath = linkConf.source.path;

  var backPath = getBackupPath(targetPath);

  let stat;
  try {
    stat = await fs.lstat(targetPath);
  } catch (e) {
    console.log('package not installed');
  }

  if (stat.isSymbolicLink()) {
    //If symlink already exist then remove it
    await fs.remove(targetPath);
  } else {
    //if real directory, remove backPath and rename
    await fs.remove(backPath);
    await fs.rename(targetPath, backPath);
  }

  await fs.ensureDir(scopedPath);
  await fs.symlink(sourcePath, targetPath);
  await fs.ensureDir(binPath);
  await linkBins(binPath, linkConf.source.bin, sourcePath);
}

function linkBins(binPath, bins, sourcePath) {
  return Promise.all(
    _.reduce(
      bins,
      function(res, bin, binName) {
        var sourceBin = path.join(sourcePath, bin);
        var targetLink = path.join(binPath, binName);
        //var bakTargetLink = path.join(binPath, binName) + '.bak';

        var promise = fs
          .removeAsync(targetLink)
          .then(function() {
            return fs.symlinkAsync(sourceBin, targetLink);
          })
          .then(function() {
            return fs.chmodAsync(targetLink, '755');
          });

        res.push(promise);
        return res;
      },
      []
    )
  );
}

async function removeLinksInDir(dir) {
  const links = await listLinksInDir(dir);

  for (let linkPath of links) {
    await fs.remove(linkPath);
    try {
      await fs.rename(getBackupPath(linkPath), linkPath);
    } catch (e) {
      // console.error(e);
    }
  }
}

function getBackupPath(packagePath) {
  const depName = path.basename(packagePath);
  return path.join(path.dirname(packagePath), `.${depName}.autolinkbackup`);
}

async function getPackageStatus(nodeModulesDir, packageName, workspaceDir) {
  const moduleDir = path.join(nodeModulesDir, packageName);
  try {
    const stat = await fs.lstat(moduleDir);
    const pack = require(path.join(moduleDir, 'package.json'));
    const res = {
      name: pack.name,
      version: pack.version
    };

    if (stat.isSymbolicLink()) {
      const linkTarget = await fs.readlink(moduleDir);
      res.isLink = true;
      res.linkTarget = linkTarget;
      if (linkTarget.startsWith(workspaceDir)) {
        res.linkTarget = linkTarget.substr(workspaceDir.length);
      }
    }
    return res;
  } catch (e) {
    return null;
  }
}

async function listLinksInDir(directory) {
  await fs.ensureDir(directory);
  const files = await fs.readdir(directory);

  const links = [];

  for (let file of files) {
    var filePath = path.join(directory, file);
    if (file[0] === '@') {
      const scopedLinks = await listLinksInDir(filePath);
      links.push(...scopedLinks);
      continue;
    }

    const stat = await fs.lstat(filePath);
    if (stat.isSymbolicLink()) {
      links.push(filePath);
    }
    // return fs.readlinkAsync(file);)
  }

  return links;
}

module.exports = {
  link,
  unlink,
  ls
};
