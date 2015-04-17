var Promise = require('bluebird');
//Promise.longStackTraces();
var fs = Promise.promisifyAll(require('fs-extra'));
var path = require('path');
var glob = Promise.promisify(require('glob'));
var endOfLine = require('os').EOL;
var _ = require('lodash');
var pathIsAbsolute = require('path-is-absolute');

//var autolinkPath = path.join(getUserHome(), '.autolink');


function AutoLinkNotFound() {}
AutoLinkNotFound.prototype = Object.create(Error.prototype);

function getDevPackagesFromPath(autolinkDir) {

    autolinkPath = path.join(autolinkDir, '.autolink');

    return fs.readFileAsync(autolinkPath)
        .catch(function() {
            return Promise.reject(new AutoLinkNotFound("Error reading .autolink file : " + autolinkPath));
        })
        .then(function(data) {

            globPatterns = data.toString().split(endOfLine);
            return Promise.all(_.map(globPatterns, function(pattern) {
                if (!pattern) {
                    return;
                }

                return glob(pattern, {
                    cwd: autolinkDir
                });
            }))

        })
        .then(function(files) {
            var packages = {};
            _.each(_.flatten(files), function(file) {
                if (!file) {
                    return;
                }
                var absoluteFilePath = pathIsAbsolute(file) ? file : path.join(autolinkDir, file);
                var package = require(absoluteFilePath);
                var dirname = path.dirname(require.resolve(absoluteFilePath));

                var versions = packages[package.name];
                if (!versions) {
                    versions = {};
                    packages[package.name] = versions;
                }
                var currentVersion = versions[package.version];
                
                if (currentVersion && currentVersion !== dirname) {
                    console.warn("version conflict : ", currentVersion, dirname);
                } else {
                    versions[package.version] = dirname;
                }
            })
            return packages;
        });
}

function getDevPackage() {
    var currentDir = process.cwd();

    var promises = [];
    promises.push(getDevPackagesFromPath(currentDir));
    do {
        currentDir = path.dirname(currentDir);
        promises.push(getDevPackagesFromPath(currentDir));
    } while (currentDir !== '/')


    return Promise.settle(promises)
        .then(function(results) {
            var packages = {};
            var autoLinkFound = false;
            var rejections = [];

            _.each(results, function(res) {
                if (res.isFulfilled()) {
                    autoLinkFound = true;
                    //console.log(res.value());
                    _.merge(packages, res.value());
                } else {
                    if (!(res.reason() instanceof AutoLinkNotFound)) {
                        rejections.push(res.reason());
                    }
                }
            })

            if (autoLinkFound) {
                return packages;
            } else if (rejections.length) {
                return Promise.reject(rejections[0].message);
            } else {
                return Promise.reject('No .autolink file could be found');
            }


        });
}

function getMatches() {
    var package;
    try {
        package = require(path.join(process.cwd(), 'package.json'));
    } catch (e) {
        return Promise.reject('No package.json found');
    }

    return getDevPackage().then(function(devPackages) {
        var matches = [];
        _.forOwn(_.merge({},
            package.dependencies,
            package.devDependencies,
            package.optionalDependencies), function(version, name) {
            if (devPackages[name]) {
                var devVersions = _.pairs(devPackages[name]);
                //TODO : choose best version
                var devVersion = devVersions[0][0];
                var devPath = devVersions[0][1];

                matches.push({
                    name: name,
                    devVersion: devVersion,
                    requiredVersion: version,
                    devPath: devPath
                });
            }
        });
        return matches;
    });
}

function linkModules() {
    return getMatches()
        .then(function(matches) {
            _.each(matches, function(match) {
                var scopeMatch = match.name.match(/^(@.*)\/.*/);
                var scope;
                if (!!scopeMatch) {
                    scope = scopeMatch[1];
                }

                var nodeModulesPath = path.join(process.cwd(), 'node_modules');
                var scopedPath = (scope) ? path.join(nodeModulesPath, scope) : nodeModulesPath;
                var targetPath = path.join(nodeModulesPath, match.name);
                var sourcePath = match.devPath;

                fs.removeAsync(targetPath)
                    .catch(function(error) {
                        //console.log(error);
                    })
                //Create node directory if doesn't exist.
                .then(function() {
                    return fs.mkdirsAsync(scopedPath);
                })
                //Create symlink
                .then(function() {
                    return fs.symlinkAsync(sourcePath, targetPath);
                })
                    .then(function() {
                        console.log('Symlink', targetPath, ' -> ', sourcePath);
                    })
                    .catch(function(e) {
                        console.error(e);
                    });

            })
        })
}


function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

module.exports = {
    getDevPackage: getDevPackage,
    getMatches: getMatches,
    linkModules: linkModules
}