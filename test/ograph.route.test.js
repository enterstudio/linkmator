'use strict';

const request = require('supertest');
const expect = require('expect');
const util = require('./util');
const mongoose = require('mongoose');
const Feed = require('../server/model/feed');
const OpenGraph = require('../server/model/opengraph');

describe('HTTP Server', function() {
  this.timeout(20000);

  before(util.waitUntilServerIsReady);

  describe('POST /api/og', function() {

    it('"url" should be required', function(done) {
      const accessToken = this.server.get('ACCESS_TOKEN');

      request(this.server)
        .post('/api/og')
        .set('Cookie', `access_token=${accessToken}`)
        .send({})
        .expect(400)
        .end(function(err, res) {
          const data = res.body;
          expect(data.status).toBe(400);
          expect(data.errors).toBeA('array');
          expect(data.errors[0].path).toBe('url');
          done();
        });
    });

    it('should create a graph with minimun data', function(done) {
      const accessToken = this.server.get('ACCESS_TOKEN');

      request(this.server)
        .post('/api/og')
        .set('Cookie', `access_token=${accessToken}`)
        .send({
          url: 'http://www.example.com'
        })
        .expect(201)
        .end(function(err, res) {
          const data = res.body.data;
          expect(data).toBeA('object');
          expect(data._id).toExist();
          done();
        });
    });
  });

  describe('POST /api/feed', function() {
    it('"data" should exist', function(done) {
      const accessToken = this.server.get('ACCESS_TOKEN');

      request(this.server)
        .post('/api/feed')
        .set('Cookie', `access_token=${accessToken}`)
        .send({})
        .expect(200)
        .end((err, res) => {
          expect(res.body.status).toEqual(400);
          done();
        });
    });

    it('"open_graph_id" should have proper type', function(done) {
      const accessToken = this.server.get('ACCESS_TOKEN');

      request(this.server)
        .post('/api/feed')
        .set('Cookie', `access_token=${accessToken}`)
        .send({
          data: {
            open_graph_id: 'invalid value'
          }
        })
        .expect(200)
        .end((err, res) => {
          expect(res.body.status).toEqual(400);
          done();
        });
    });

    // Note: Need Seed Data
    it('should create a feed item', function(done) {
      const accessToken = this.server.get('ACCESS_TOKEN');

      OpenGraph.findOne({
        url: 'http://www.example.com'
      }).then((graph) => {

        request(this.server)
          .post('/api/feed')
          .set('Cookie', `access_token=${accessToken}`)
          .send({
            data: {
              open_graph_id: graph.id
            }
          })
          .expect(201)
          .end((error, res) => {
            expect(error).toNotExist();
            expect(res.body.data.feed_id).toExist();
            done();
          });
      }).catch(done);
    });
  });


  describe('GET /api/feed', function() {
    it('should validate "type"', function(done) {
      const accessToken = this.server.get('ACCESS_TOKEN');

      request(this.server)
        .get('/api/feed?type=INVALID_VALUE')
        .set('Cookie', `access_token=${accessToken}`)
        .expect(200)
        .end((err, res) => {
          expect(res.body.status).toEqual(400);
          expect(res.body.errors).toExist();
          done();
        });
    });


    it('should return a fedd', function(done) {
      const accessToken = this.server.get('ACCESS_TOKEN');

      request(this.server)
        .get('/api/feed')
        .set('Cookie', `access_token=${accessToken}`)
        .expect(200)
        .end((err, res) => {
          expect(res.body.status).toEqual(200);
          expect(res.body.data).toExist();
          // Note: Seed test data.
          // expect(res.body.data.person).toExist();
          // expect(res.body.data.feed).toExist();
          // expect(res.body.data.feed).toBeA(Array);
          expect(res.body.errors).toNotExist();
          done();
        });
    });
  });


  describe('Model: Feed', function() {
    it('should not accept custom "type"', (done) => {
      // see: server/model/feed.js for acceptable type values
      const feedData = {
        creator: mongoose.Schema.ObjectId(),
        type: 'NOT_ACCEPTABLE_TYPE',
        opengraph: mongoose.Schema.ObjectId()
      };

      const feed = new Feed(feedData);
      feed.validate().catch((error) => {
        expect(error.errors.type).toExist();
        done();
      });
    });

    it('should create a feed', function(done) {
      const feedData = {
        creator: mongoose.Schema.ObjectId(),
        type: 'PRIVATE',
        opengraph: mongoose.Schema.ObjectId()
      };

      Feed.create(feedData, (error, feed) => {
        expect(feed).toExist();
        done();
      });
    });
  });

  describe('Post registration', function() {
    it('should create a person when registered', function(done) {
      const handler = require('../server/middleware/postRegistrationHandler');
      const account = {
        username: 'test@example.com',
        email: 'test@example.com',
        href: 'link_to_stormpath_account',
        givenName: 'Test',
        surname: 'Test',
        customData: {
          save: expect.createSpy().andCall((fn) => fn())
        }
      };

      handler(account, undefined, undefined, (error, model) => {
        expect(error).toEqual(null);
        expect(account.customData.mongoId).toExist();
        expect(account.customData.save).toHaveBeenCalled();
        done();
      });
    });
  });
});
