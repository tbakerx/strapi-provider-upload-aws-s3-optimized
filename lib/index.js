'use strict';

const AWS = require('aws-sdk');
const sharp = require('sharp');

const trimParam = str => (typeof str === 'string' ? str.trim() : undefined);
const optimize = async (config, file) => {
  const {smallWidth, mediumWidth, largeWidth, smallHeight, mediumHeight, largeHeight, quality, webp} = config;
  const buffer = new Buffer(file.buffer, 'binary');
  const sizes = [];
  /* Generate the small sizes */
  if(file.ext === '.png'){
    await sharp(buffer).resize(parseInt(smallWidth), parseInt(smallHeight)).png({quality: parseInt(quality)}).toBuffer()
    .then( data => { sizes.push({buffer: data, size:'S', mime: 'image/png', ext: '.png'}) })
  } else {
    await sharp(buffer).resize(parseInt(smallWidth), parseInt(smallHeight)).jpeg({quality: parseInt(quality)}).toBuffer()
    .then( data => { sizes.push({buffer: data, size:'S', mime: 'image/jpg', ext: '.jpg'}) })
  }
  if(webp === 'yes'){
    await sharp(buffer).resize(parseInt(smallWidth), parseInt(smallHeight)).webp({quality: parseInt(quality)}).toBuffer()
    .then( data => { sizes.push({buffer: data, size:'S', mime: 'image/webp', ext: '.webp'}) })
  }
  /* Generate the medium sizes */
  if(file.ext === '.png'){
    await sharp(buffer).resize(parseInt(mediumWidth), parseInt(mediumHeight)).png({quality: parseInt(quality)}).toBuffer()
    .then( data => { sizes.push({buffer: data, size:'M', mime: 'image/png', ext: '.png'}) })
  } else {
    await sharp(buffer).resize(parseInt(mediumWidth), parseInt(mediumHeight)).jpeg({quality: parseInt(quality)}).toBuffer()
    .then( data => { sizes.push({buffer: data, size:'M', mime: 'image/jpg', ext: '.jpg'}) })
  }
  if(webp === 'yes'){
    await sharp(buffer).resize(parseInt(mediumWidth), parseInt(mediumHeight)).webp({quality: parseInt(quality)}).toBuffer()
    .then( data => { sizes.push({buffer: data, size:'M', mime: 'image/webp', ext: '.webp'}) })
  }
  /* Generate the large sizes */
  if(file.ext === '.png'){
    await sharp(buffer).resize(parseInt(largeWidth), parseInt(largeHeight)).png({quality: parseInt(quality)}).toBuffer()
    .then( data => { sizes.push({buffer: data, size:'L', mime: 'image/png', ext: '.png'}) })
  } else {
    await sharp(buffer).resize(parseInt(largeWidth), parseInt(largeHeight)).jpeg({quality: parseInt(quality)}).toBuffer()
    .then( data => { sizes.push({buffer: data, size:'L', mime: 'image/jpg', ext: '.jpg'}) })
  }
  if(webp === 'yes'){
    await sharp(buffer).resize(parseInt(largeWidth), parseInt(largeHeight)).webp({quality: parseInt(quality)}).toBuffer()
    .then( data => { sizes.push({buffer: data, size:'L', mime: 'image/webp', ext: '.webp'}) })
  }
  return sizes;
}

module.exports = {
  provider: 'aws-s3-optimized',
  name: 'AWS S3 Optimized',
  auth: {
    public: {
      label: 'Access API Token',
      type: 'text',
    },
    private: {
      label: 'Secret Access Token',
      type: 'text',
    },
    region: {
      label: 'Region',
      type: 'enum',
      values: [
        'us-east-1',
        'us-east-2',
        'us-west-1',
        'us-west-2',
        'ca-central-1',
        'ap-south-1',
        'ap-northeast-1',
        'ap-northeast-2',
        'ap-northeast-3',
        'ap-southeast-1',
        'ap-southeast-2',
        'cn-north-1',
        'cn-northwest-1',
        'eu-central-1',
        'eu-north-1',
        'eu-west-1',
        'eu-west-2',
        'eu-west-3',
        'sa-east-1',
      ],
    },
    bucket: {
      label: 'Bucket',
      type: 'text',
    },
    smallWidth: {
      label: 'Small Width',
      type: 'number'
    },
    mediumWidth: {
      label: 'Medium Width',
      type: 'number'
    },
    largeWidth: {
      label: 'Large Width',
      type: 'number'
    },
    smallHeight: {
      label: 'Small Height',
      type: 'number'
    },
    mediumHeight: {
      label: 'Medium Height',
      type: 'number'
    },
    largeHeight: {
      label: 'Large Height',
      type: 'number'
    },
    quality: {
      label: 'Image Quality %',
      type: 'enum',
      values: [
        100,
        90,
        80,
        70,
        60,
        50,
        40,
        30,
        20,
        10
      ],    
    },
    webp: {
      label: 'Create WebP',
      type: 'enum',
      values: [
        'yes',
        'no'
      ],    
    }
  },
  init: config => {
    // configure AWS S3 bucket connection
    AWS.config.update({
      accessKeyId: trimParam(config.public),
      secretAccessKey: trimParam(config.private),
      region: config.region
    });

    const S3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: {
        Bucket: trimParam(config.bucket),
      },
    });

    return {
      upload: async file => {
        if(file.ext === '.jpg' || file.ext === '.png'){
          const sizes = await optimize(config, file);
          sizes.forEach(({size, buffer, mime, ext}) => {
            return new Promise((resolve, reject) => {
              // upload file on S3 bucket
              const path = file.path ? `${file.path}/` : '';
              S3.upload(
                {
                  Key: `${path}${file.hash}-${size}${ext}`,
                  Body: new Buffer(buffer, 'binary'),
                  ACL: 'public-read',
                  ContentType: mime,
                },
                (err, data) => {
                  if (err) {
                    return reject(err);
                  }
                  // set the bucket file url
                  file.url = data.Location;
                  resolve();
                }
              );
            });
          });
        }
        return new Promise((resolve, reject) => {
          // upload file on S3 bucket
          const path = file.path ? `${file.path}/` : '';
          S3.upload(
            {
              Key: `${path}${file.hash}${file.ext}`,
              Body: new Buffer(file.buffer, 'binary'),
              ACL: 'public-read',
              ContentType: file.mime,
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }
              // set the bucket file url
              file.url = data.Location;
              resolve();
            }
          );
        });
      },
      delete: file => {
        return new Promise((resolve, reject) => {
          // delete file on S3 bucket
          const path = file.path ? `${file.path}/` : '';
          S3.deleteObject(
            {
              Key: `${path}${file.hash}${file.ext}`,
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }
              resolve();
            }
          );
          S3.deleteObject(
            {
              Key: `${path}${file.hash}-S${file.ext}`,
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }
              resolve();
            }
          );
          S3.deleteObject(
            {
              Key: `${path}${file.hash}-S.webp`,
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }
              resolve();
            }
          );
          S3.deleteObject(
            {
              Key: `${path}${file.hash}-M${file.ext}`,
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }
              resolve();
            }
          );
          S3.deleteObject(
            {
              Key: `${path}${file.hash}-M.webp`,
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }
              resolve();
            }
          );
          S3.deleteObject(
            {
              Key: `${path}${file.hash}-L${file.ext}`,
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }
              resolve();
            }
          );
          S3.deleteObject(
            {
              Key: `${path}${file.hash}-L.webp`,
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }
              resolve();
            }
          );
        });
      },
    };
  },
};
