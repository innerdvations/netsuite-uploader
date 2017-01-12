//// This file is the restlet that must be added to netsuite. Use the script id in nsuploader config.
'use strict';

function err(code, data) {
  if (code == 'param') return {message: 'Missing parameter', param: data};
}

// Upload file to netsuite.  Either data.folder or data.path must be
// data.name: string, filename
// data.content: string, file content
// data.folder (*optional): string/int, netsuite id of folder to upload file into
// data.path (*optional): string, used for determining folder id if folder id not given and multiple files with same name exist
//
function writeFile(data) {
  if (!data) return err('param', '_');
  if (!data.name) return err('param', 'name');
  if (!data.content) return err('param', 'content');

  var newFileNumber;
  var folder;
  var file = nlapiCreateFile(data.name, 'PLAINTEXT', data.content);

  if (data.folder) { // use folder given. IMPORTANT: there is no error checking
    folder = data.folder;
  } else { // determine existing folder
    var files = nlapiSearchRecord('file', null,
      [new nlobjSearchFilter('name', null, 'is', data.name)],
      [new nlobjSearchColumn('folder')]) || [];

    if (!data.path) return err('param', 'path');

    var path = data.path.split(/[/\\]/);

    //Remove filename
    path.pop();

    if (files.length === 1) {
      folder = files[0].getValue('folder');

      //Otherwise if the uploaded path is more than just filename
    } else if (path.length > 0 && files.length > 1) {

      var folderName = path.pop();

      for (var i = 0; i < files.length; i++) {
        if (files[i].getText('folder') === folderName) {
          folder = files[i].getValue('folder');
        }
      }
    }
  }
  file.setFolder(folder);

  if (!folder) return err('unkn', 'content');

  newFileNumber = nlapiSubmitFile(file);

  nlapiLogExecution('DEBUG', 'uploaded', data.path.toString());
  return newFileNumber;
}
