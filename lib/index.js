'use strict';

const AWS = require('aws-sdk');
const sharp = require('sharp');

const trimParam = str => (typeof str === 'string' ? str.trim() : undefined);

const createSizes = async (file, config) => {
  const buffer = new Buffer(file.buffer, 'binary');
  const {sizes, webp, quality} = config;
  const imageSizes = sizes.split(',')
  const imagesToCreate = imageSizes.map(async size => {
    let WxH = size.split('x');
    let width = parseInt(WxH[0]);
    let height = parseInt(WxH[1]);
    let imgQ = parseInt(quality);
    let images = [];
    /* Create & Optimize the size based on extension */
    switch(file.ext) {
      case '.png': images.push(await sharp(buffer).resize(width, height, {fit: sharp.fit.cover, withoutEnlargement: true}).png({quality: imgQ}).toBuffer()
          .then(data => ({buffer: data, mime:file.mime, ext: file.ext, suffix:`-${width}-${height}${file.ext}`})))
        break;
      case '.jpg': images.push(await sharp(buffer).resize(width, height, {fit: sharp.fit.cover, withoutEnlargement: true}).jpeg({quality: imgQ}).toBuffer()
          .then(data => ({buffer: data, mime:file.mime, ext: file.ext, suffix:`-${width}-${height}${file.ext}`})))
        break;
      case '.jpeg': images.push(await sharp(buffer).resize(width, height, {fit: sharp.fit.cover, withoutEnlargement: true}).jpeg({quality: imgQ}).toBuffer()
          .then(data => ({buffer: data, mime:file.mime, ext: file.ext, suffix:`-${width}-${height}${file.ext}`})))
        break;
    }
    /* Create the WebP image for each size if enabled */
    if(webp === 'yes') images.push(await sharp(buffer).resize(width, height, {fit: sharp.fit.cover, withoutEnlargement: true}).webp({quality: imgQ}).toBuffer()
    .then(data => ({buffer: data, mime:'image/webp', ext: '.webp', suffix:`-${width}-${height}.webp`})))
    return images;
  });
  return Promise.all(imagesToCreate);
}
const getSizesToDelete = (file, config) => {
  const {sizes, webp} = config;
  const imageSizes = sizes.split(',')
  const sizesToDelete = imageSizes.map(size => {
    let WxH = size.split('x');
    let width = parseInt(WxH[0]);
    let height = parseInt(WxH[1]);
    let sizes = [];
    /* Create & Optimize the size based on extension */
    switch(file.ext) {
      case '.png': sizes.push({suffix:`-${width}-${height}.png`})
        break;
      case '.jpg': sizes.push({suffix:`-${width}-${height}.jpg`})
        break;
      case '.jpeg': sizes.push({suffix:`-${width}-${height}.jpg`})
        break;
    }
    /* Create the WebP image for each size if enabled */
    if(webp === 'yes') sizes.push({suffix:`-${width}-${height}.webp`})
    return sizes;
  });
  return sizesToDelete;
}
module.exports = {
  provider: 's3-optimized',
  name: 'S3 Optimized',
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
      type: 'text',
    },
    bucket: {
      label: 'Bucket',
      type: 'text',
    },
    sizes: {
      label: 'Sizes',
      type: 'textarea'
    },
    webp: {
      label: 'Create WebP',
      type: 'enum',
      values: [
        'yes',
        'no'
      ],    
    },
    quality: {
      label: 'Quality',
      type: 'number',
      min: 10,
      max: 100
    }
  },
  init: config => {
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
        /* Create the sizes */
        const sizes = await createSizes(file, config);
        sizes.forEach(images => {
          images.forEach(image => {
            const {buffer, mime, suffix} = image;
            return new Promise((resolve, reject) => {
              const path = file.path ? `${file.path}/` : '';
              S3.upload({
                  Key: `${path}${file.hash}${suffix}`,
                  Body: new Buffer(buffer, 'binary'),
                  ACL: 'public-read',
                  ContentType: mime,
                },
                (err, data) => {
                  if (err) {
                    return reject(err);
                  }
                  resolve();
                }
              );
            });
          })
        });
        return new Promise((resolve, reject) => {
          const path = file.path ? `${file.path}/` : '';
          S3.upload({
              Key: `${path}${file.hash}${file.ext}`,
              Body: new Buffer(file.buffer, 'binary'),
              ACL: 'public-read',
              ContentType: file.mime,
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }
              file.url = data.Location;
              resolve();
            }
          );
        });
      },
      delete: async file => {
        /* Delete the sizes */
        const sizes = getSizesToDelete(file, config);
        sizes.forEach(images => {
          images.forEach(image => {
            return new Promise((resolve, reject) => {
              const path = file.path ? `${file.path}/` : '';
              S3.deleteObject({
                  Key: `${path}${file.hash}${image.suffix}`,
                },(err, data) => {
                  if (err) {
                    return reject(err);
                  }
                  resolve();
                }
              );
            });
          })
        });
        return new Promise((resolve, reject) => {
          const path = file.path ? `${file.path}/` : '';
          S3.deleteObject({
              Key: `${path}${file.hash}${file.ext}`,
            },(err, data) => {
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
