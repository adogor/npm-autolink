#!/usr/bin/env node

'use strict';
const chalk = require('chalk');
const program = require('commander');
const _ = require('lodash');
const path = require('path');
const treeify = require('treeify');

const autolink = require('./');

let isOk = false;

program.description('Npm autolink : automatic projects npm link');

program
  .command('link')
  .description('Link packages according to autolink.json file')
  .action(function(cmd, options) {
    isOk = true;
    autolink
      .link()
      .then(function(dir) {
        console.log(treeify.asTree(dir, true));
      })
      .catch(function(e) {
        console.error(e.stack);
      });
  });

program
  .command('unlink')
  .description('Unlink packages according to autolink.json file')
  .action(function(cmd, options) {
    isOk = true;
    autolink
      .unlink()
      .then(function(dir) {
        console.log(treeify.asTree(dir, true));
      })
      .catch(function(e) {
        console.error(e.stack);
      });
  });

program
  .command('ls')
  .description('List workspace dependencies')
  .action(function(cmd, options) {
    isOk = true;
    autolink
      .ls()
      .then(function(dir) {
        console.log(treeify.asTree(dir, true));
      })
      .catch(function(e) {
        console.error(e.stack);
      });
  });

program.parse(process.argv);

if (!program.args.length || !isOk) {
  program.help();
}
