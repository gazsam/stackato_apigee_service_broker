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

var chai = require('chai')
chai.use(require('chai-things'))
var expect = chai.expect
var should = require('should')  // eslint-disable-line
var supertest = require('supertest')
var server = require('../server')
// Using Port 8000 to start test server
var port = 8000
var api = supertest('http://localhost:' + port)
var app
var config = require('../helpers/config')

/* Mock Apigee API Calls using NOCK for testing */
require('./helpers/api_mocks.js')

describe('Starting Tests..', function () {
  this.timeout(0)
  var authHeader = 'Basic ' + new Buffer(config.get('SECURITY_USER_NAME') + ':' + config.get('SECURITY_USER_PASSWORD')).toString('base64')
  var badAuthHeader = 'Basic ' + new Buffer('admin:' + 'wrong-password').toString('base64')
  before(function () {  // eslint-disable-line
    app = server.listen(8000)
  })
  describe('API Securtiy', function () {
    it('Valid Auth should return 200', function (done) {
      api.get('/')
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(200)
        .end(function (err, res) {
          expect(err).equal(null)
          expect(res.body).to.have.property('message')
          done()
        })
    })
    it('Invalid Auth should return 401', function (done) {
      api.get('/')
        .set('Accept', 'application/json')
        .set('Authorization', badAuthHeader)
        .expect(401, done)
    })
  })
  describe('Catalog APIs', function () {
    it('Invalid Auth should return 401', function (done) {
      api.get('/v2/catalog')
        .set('Accept', 'application/json')
        .expect(401, done)
    })
    it('Valid Auth should return 200', function (done) {
      api.get('/v2/catalog')
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(200, done)
    })
    it('Catalog API should return list of service plans', function (done) {
      api.get('/v2/catalog')
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(200)
        .end(function (err, res) {
          expect(err).equal(null)
          expect(res.body).to.have.property('services')
          res.body.services.forEach(function (service) {
            service.should.have.property('name')
            service.should.have.property('id')
            service.should.have.property('description')
            service.should.have.property('bindable')
            service.should.have.property('plans')
            service.plans.forEach(function (plan) {
              plan.should.have.property('id')
              plan.should.have.property('name')
              plan.should.have.property('description')
            })
          })
          done()
        })
    })
  })
  describe('Service Instance APIs', function () {
    it('Invalid Auth should return 401', function (done) {
      api.put('/v2/service_instances/:instance_id')
        .set('Accept', 'application/json')
        .expect(401, done)
    })
    it('Patch to Service Instance should return 422', function (done) {
      api.patch('/v2/service_instances/:instance_id')
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(422, done)
    })
    it('Invalid Apigee Credentials on service instance creation should return a 401 response', function (done) {
      var serviceInstance = {
        instance_id: 'instance-guid-here',
        payload: {
          organization_guid: 'org-guid-here',
          plan_id: 'plan-guid-here',
          service_id: 'service-guid-here',
          space_guid: 'space-guid-here',
          parameters: {
            org: 'org-name-here',
            env: 'env-name-here',
            user: 'apigee-user-here',
            pass: 'apigee-pass-here'
          }
        }
      }
      api.put('/v2/service_instances/' + serviceInstance.instance_id)
        .send(serviceInstance.payload)
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(401, done)
    })
    it('Valid Apigee Credentials on service instance creation should return a 201 response', function (done) {
      var serviceInstance = {
        instance_id: 'instance-guid-here',
        payload: {
          organization_guid: 'org-guid-here',
          plan_id: 'plan-guid-here',
          service_id: 'service-guid-here',
          space_guid: 'space-guid-here',
          parameters: {
            org: 'cdmo',
            env: 'test',
            user: 'XXXXX',
            pass: 'XXXXXXX'
          }
        }
      }
      api.put('/v2/service_instances/' + serviceInstance.instance_id)
        .send(serviceInstance.payload)
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(201, done)
    })
  })

  describe('Route Binding APIs', function () {
    it('Invalid Auth should return 401', function (done) {
      api.put('/v2/service_instances/:instance_id/service_bindings/:binding_id')
        .set('Accept', 'application/json')
        .expect(401, done)
    })
    it('Invalid JSON req payload should return Json Schema Validation error', function (done) {
      api.put('/v2/service_instances/12345')
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .send("{'invalidJSON")
        .expect(400)
        .end(function (err, res) {
          expect(err).equal(null)
          expect(res.body).to.have.property('jsonSchemaValidation')
          expect(res.body.jsonSchemaValidation).to.equal(true)
          done()
        })
    })
    it('Valid Auth on route binding API should return 201', function (done) {
      var bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here',
        payload: {
          plan_id: 'plan-guid-here',
          service_id: 'service-guid-here',
          bind_resource: {
            route: 'route-url-here'
          }
        }
      }
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
        .send(bindingInstance.payload)
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(201, done)
    })
  })
  describe('Delete Route Binding & Delete Service Instance', function () {
    it('Invalid Auth should return 401 on route binding deletion', function (done) {
      api.put('/v2/service_instances/:instance_id/service_bindings/:binding_id')
        .set('Accept', 'application/json')
        .expect(401, done)
    })
    it('Valid Auth on delete binding API call should return 200', function (done) {
      var bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here'
      }
      api.del('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(200, done)
    })
    it('Invalid Auth should return 401 on service instance deletion', function (done) {
      api.del('/v2/service_instances/:instance_id')
        .set('Accept', 'application/json')
        .expect(401, done)
    })
    it('Invalid Service Instance delete should return a 410 response', function (done) {
      var serviceInstance = 'Non-Exist'
      api.del('/v2/service_instances/' + serviceInstance.instance_id)
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(410, done)
    })
    it('Valid service instance delete should delete the instance and return 200', function (done) {
      var serviceInstance = 'instance-guid-here'
      api.del('/v2/service_instances/' + serviceInstance)
        .set('Authorization', authHeader)
        .expect(200, done)
    })
  })
  after(function (done) {   // eslint-disable-line
    this.timeout(0)
    app.close()
    done()
  })
})
