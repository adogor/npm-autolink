#!/usr/bin/env node

'use strict';
var chalk = require('chalk');
var program = require('commander');
var Table = require('cli-table');
var _ = require('lodash');
var path = require('path');

var autolink = require('../');

program.description('Npm autolinking feature');

program
    .command('list')
    .description('List dev packages available')
    .action(function(cmd, options) {
        autolink.getDevPackage()
            .then(function(packages) {
                //console.log(packages);
                if (!packages) {
                    console.log(chalk.red('No packages found'));
                }
                var table = new Table();

                _.forOwn(packages, function(versions, name) {
                    //var style = chalk.black;
                    var versionTable = new Table({
                        chars: {
                            'top': '',
                            'top-mid': '',
                            'top-left': '',
                            'top-right': '',
                            'bottom': '',
                            'bottom-mid': '',
                            'bottom-left': '',
                            'bottom-right': '',
                            'left': '',
                            'left-mid': '',
                            'mid': '',
                            'mid-mid': '',
                            'right': '',
                            'right-mid': '',
                            'middle': ' '
                        },
                        style: {
                            'padding-left': 0,
                            'padding-right': 0
                        }
                    });
                    _.forOwn(versions, function(value, version) {
                        var obj = {};
                        obj[version] = value.path;
                        versionTable.push(obj);
                    });

                    var obj = {};
                    obj[name] = versionTable.toString();
                    table.push(obj);
                });

                console.log(table.toString());
            })
            .catch(function(e) {
                console.error(e);
            });
    });

program
    .command('matches')
    .description('List packages that can be linked')
    .action(function(cmd, options) {
        autolink.getMatches()
            .then(function(packages) {
                if (!packages || !packages.length) {
                    console.log(chalk.red('No matches found'));
                }
                var table = new Table({
                    head: ['Name', 'Semver Range', 'Match path', 'Match version']
                });
                _.each(packages, function(pack) {
                    var style = chalk.black;
                    table.push([style(pack.name),
                        style(pack.requiredRange),
                        style(pack.devPath),
                        style(pack.devVersion)
                    ]);
                });

                console.log(table.toString());
            }).catch(function(e) {
                console.error(e.stack);
            });
    });

program
    .command('link [name]')
    .description('Add link, id no name provided link all matches')
    .action(function(name, options) {
        autolink.linkModules(name)
            .then(function(links) {
                displayLinks(links);
            })
            .catch(function(e) {
                console.error(e);
            });
    });

function displayLinks(links) {
    var table = new Table({
        head: ['link', 'target', 'version']
    });
    //console.log(links);
    _.each(links, function(link) {
        var style = chalk.black;
        if (link.removed) {
            style = chalk.red.strikethrough;
        } else if (link.added) {
            style = chalk.bold.blue;
        }
        table.push([style(path.basename(link.path)), style(link.target), style(link.version)]);
    });

    console.log(table.toString());
}

program
    .command('remove [name]')
    .description('remove link')
    .action(function(name, options) {
        autolink.removeLinks(name)
            .then(function(links) {
                displayLinks(links);
            }).catch(function(e) {
                console.error(e);
            });
    });

program.parse(process.argv);

if (!program.args.length) {
    autolink.listLinks()
        .then(function(linksList) {
            displayLinks(linksList);
        })
        .catch(function(e) {
            console.error(e);
        });
}