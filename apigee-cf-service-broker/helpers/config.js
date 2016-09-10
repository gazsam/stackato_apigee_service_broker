'use strict'
/**
 * Copyright (C) 2016 Apigee Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var nconf = require('nconf')
var log = require('bunyan').createLogger({name: 'apigee', src: true})

// arguments, environment vars
nconf.argv()
  .env()
  .file({file: 'tmp.json'}) // not used, but required to nconf.set later on

// read from manifest.yml if in TEST
if (process.env.NODE_ENV === 'TEST') {
  var yaml = require('js-yaml')
  var fs = require('fs')
  var defaults = yaml.safeLoad(fs.readFileSync('manifest.yml', 'utf8'))
  nconf.defaults(defaults.env)
  nconf.set('SECURITY_USER_PASSWORD', 'testing')
  nconf.set('SECURITY_USER_NAME', 'tester')
}

module.exports = nconf
