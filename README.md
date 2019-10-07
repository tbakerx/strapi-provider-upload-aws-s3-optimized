# strapi-provider-upload-aws-s3-optimized
Creates 3 additional images sizes and optimizes them before uploading to S3.  The three sizes will share the url of the original file with the size attached.  

Examples: 
- Size 1: https://yourbucket.s3.us-west-1.amazonaws.com/fsf4be14b028c0-S1.jpg
- Size 2: https://yourbucket.s3.us-west-1.amazonaws.com/fsf4be14b028c0-S2.jpg
- Size 3: https://yourbucket.s3.us-west-1.amazonaws.com/fsf4be14b028c0-S3.jpg
- WebP (created for all sizes) : https://yourbucket.s3.us-west-1.amazonaws.com/fsf4be14b028c0-S1.webp

## Installation
```bash
npm install strapi-provider-upload-aws-s3-optimized
```

## Usage
Install and configure: http://localhost:1337/admin/plugins/upload/configurations/development
