'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Person = new Schema(
  {
    username: String,
    email: {
      type: String,
      index: true
    },
    href: String,
    givenName: String,
    surname: String,

    // Gravatar
    gravatarUrl: String,
    emailMd5Hash: String
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Person', Person);
