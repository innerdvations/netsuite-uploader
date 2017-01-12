# netsuite-uploader

### A node module for uploading to netsuite

netsuite-uploader uploads file to NetSuite. Recommended and designed
for use with a build system ([grunt](/gruntjs/grunt)/[gulp](/gulpjs/gulp)) that can
auto-watch your files for changes.

Fork of https://github.com/dturton/nsupload with added ability to choose upload folder.

## Installation

Install and deploy the included restlet `restlet-netsuite-uploader.js`. You'll need the script internal id to configure properly

You'll probably want to use the PUT verb for the function, although NetSuite doesn't allow you to be truly 
restful anyway (no semantic URI), so use a POST if you like it better.

```javascript
var sendToNetsuite = require('nsupload')
  .config({
    email: 'admin@example.com',
    password: 'Password01', //DON'T USE THIS EVER. PLEASE.
    account: 1234,
    script: 12
  });

sendToNetsuite('./foo.js', function(err, body) {
  //Check for errors

  console.log('Success!');
  console.log(body);
});

sendToNetsuite('./foo.js').then(function handleSuccess(body) {
  console.log('Success again!');
  console.log(body);
}, function handleError(e) {
  console.log('Error:\n\t' + e.toString());
});
```
