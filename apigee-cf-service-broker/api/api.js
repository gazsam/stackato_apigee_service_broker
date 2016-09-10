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

/*
 Dump out version info, hosting location, etc.
*/

var config = require('../helpers/config')
var express = require('express')
var router = express.Router()

var auth = require('../helpers/auth')('staticauth')

router.use(auth)
router.get('/', function (req, res) {
  res.json({ message: 'This is the cf-apigee-broker CF Service Broker API.', configuration: 'Blocked' })
})

module.exports = router
