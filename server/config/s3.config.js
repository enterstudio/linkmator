'use strict';

module.exports = () => {
  return {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: process.env.S3_REGION,
    bucket: process.env.S3_BUCKET,
    objectKey: process.env.S3_OBJECT_KEY
  };
};
