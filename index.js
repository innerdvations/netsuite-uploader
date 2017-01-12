var request = require('request')
  , _ = require('underscore')
  , q = require('q')
  , fs = require('fs')
  , path = require('path');

var URL_TEMPLATE = 'https://<%= domain %>/app/site/hosting/restlet.nl';
var url;

var AUTH_STRING = 'NLAuth  nlauth_account=<%= account %>, nlauth_email=<%= email %>, nlauth_signature=<%= password %>';

var nsupload = require('nsupload')
  , through = require('through');

/**
 * @module
 * @function
 * @name nsupload
 * @param {String} file The filename to upload
 * @param {Function} cb The callback that will be called in the idiomatic node style.
 * Should have signature `function(err, data)` and will be passed any errors or the
 * response body from netsuite.
 * @returns {Q.Promise} A [promise](https://github.com/kriskowal/q) that will be 
 * resolved when the upload completes or rejected with the reason for failure.
 * @description A module for uploading a file to netsuite by path. Includes the complementary restlet.
 * @example
 * ```javascript
 * var sendToNetsuite = require('nsupload')
 *   .config({
 *     email: 'admin@example.com',
 *     password: 'Password01', //DON'T USE THIS EVER. PLEASE.
 *     account: 1234,
 *     script: 12
 *   });
 *
 * sendToNetsuite('./foo.js', function(err, body) {
 *   //Check for errors
 *
 *   console.log('Success!');
 *   console.log(body);
 * });
 *
 * sendToNetsuite('./foo.js').then(function handleSuccess(body) {
 *   console.log('Success again!');
 *   console.log(body);
 * }, function handleError(e) {
 *   console.log('Error:\n\t' + e.toString());
 * });
 * ```
 */

/**
 * @method
 * @name nsupload.config
 * @param {Object} config The configuration object.
 * Should have properties:
 * - email - The email address of an authorized user
 * - password - The password for the same user
 * - account - The netsuite account number (get from Setup > Integration > Webservices)
 * - script - The script ID of the deployed restlet.
 * - [domain] - Optional domain root for your nestuite instance. Defaults to rest.sandbox.netsuite.com
 * - [method] - The HTTP verb you've associated the restlet function with. Should be PUT or POST for obvious reasons.
 * @description A function to set the configuration for nsuploader.
 */

var config;

//Catch files
module.exports = function sendFile (fileInfo, cb) {
  if(!config) {
    throw new Error('nsupload module not configured. Please use nsupload.config to set configuration.');
  } else if(!(config.email && config.password && config.account && config.script)) {
    throw new Error('nsupload:\n\t Please include email, password, account, and script properties in configuration');
  }

  cb = cb || function nop(){};

  url = _.template(URL_TEMPLATE)(config);
  var authHeader = _.template(AUTH_STRING)(config);
  var deferred = q.defer();
  var folderId = fileInfo.folder || null;
  var e;
  var filePath = fileInfo.path;
  if(!filePath) {
    setImmediate(function() {
      e = new Error('No filename passed');
      cb(e);
      return deferred.reject(e);
    });
  }

  if(_.isString(filePath)) {
    //Upload them to netsuite by name
    var fileName = path.basename(filePath);

    fs.readFile(filePath, function(err, data) {
      if(err) {
        e = new Error('Error loading file:\n\t' + err.toString());

        cb(e);
        return deferred.reject(e);
      }

      if(!data) {
        e = new Error('Empty file');
        cb(e);
        return deferred.reject(e);
      }

      //Make http request
      request({
        uri: url,
        qs: {
          deploy: 1,
          script: config.script
        },
        method: config.method || 'PUT',
        headers: {
          Authorization: authHeader
        },
        json: {
          name: fileName,
          path: filePath,
          folder: folderId,
          content: data.toString()
        }
      }, function(err, res, data) {
        if(err || !res) {
          e = new Error('Problem uploading file:\n\t' + err.toString());

          cb(e);
          deferred.reject(e);
        } else if(res.body && !res.body.error && res.body.statusCode && res.body.statusCode !== 200){
          cb(res.body);
          deferred.reject(res.body);
        } else {
          //Netsuite is a bit non-standard in their use of HTTP status codes and headers. This may not work, e.g. when the
          //file does not exist on netsuite.

          cb(null, res.body);
          deferred.resolve(res.body);
        }
      });
    });

  } else {
    setImmediate(function() {
      e = new Error('Could not handle filePath passed (was not a string).');
      cb(e);
      return deferred.reject(e);
    });
  }

  return deferred.promise;
};

module.exports.config = function(_config) {
  _config.domain = _config.domain || 'rest.sandbox.netsuite.com';

  if(_config) {
    config = _config;
  } else {
    throw new Error('nsuploader: Invalid config specified');
  }
};

