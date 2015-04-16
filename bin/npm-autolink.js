#!/usr/bin/env node

'use strict';

var program = require('commander');
var autolink = require('../');

program.description('Npm autolinking feature');

program
    .command('list')
    .description('list dev packages available')
    .action(function(cmd, options) {
        autolink.getDevPackage()
            .then(function(packages) {
                console.log((packages)?packages:'No packages found');
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
                console.log((packages)?packages:'No matches found');
            }).catch(function(e) {
                console.error(e);
            })
    });


program.parse(process.argv);

if (!program.args.length) {
    autolink.linkModules()
        .catch(function(e) {
            console.error(e);
        });
}