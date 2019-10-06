# strapi-provider-upload-aws-s3-optimized
Creates 3 additional images sizes and optimizes them before uploading to S3.  The three sizes will share the url of the original file with the size attached.  

Examples: 
- Small Size: https://yourbucket.s3.us-west-1.amazonaws.com/fsf4be14b028c0-S.jpg
- Medium Size: https://yourbucket.s3.us-west-1.amazonaws.com/fsf4be14b028c0-M.jpg
- Large Size: https://yourbucket.s3.us-west-1.amazonaws.com/fsf4be14b028c0-L.jpg
- WebP (Created for each size if enabled): https://yourbucket.s3.us-west-1.amazonaws.com/fsf4be14b028c0-L.webp

## Installation
```bash
npm install strapi-provider-upload-aws-s3-optimized
```

## Usage
Install and configure: http://localhost:1337/admin/plugins/upload/configurations/development
