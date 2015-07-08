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
    .description('list dev packages available')
    .action(function(cmd, options) {
        autolink.getDevPackage()
            .then(function(packages) {
                console.log(chalk.red((packages) ? packages : 'No packages found'));
            })
            .catch(function(e) {
                console.error(e);
            })
    });

program
    .command('matches')
    .description('list packages matches that will be linked')
    .action(function(cmd, options) {
        autolink.getMatches()
            .then(function(packages) {
                console.log(chalk.orange((packages) ? packages : 'No matches found'));
            }).catch(function(e) {
                console.error(e);
            })
    });

program
    .command('link [name]')
    .description('add link')
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
        }else if (link.added) {
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