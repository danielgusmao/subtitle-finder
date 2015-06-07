var path = require('path')
  , config = require(path.join(__dirname, 'config.json'))
  , opensubtitles = require('opensubtitles-client')
  , recursive = require('recursive-readdir')
  , request = require('request')
  , zlib = require('zlib')
  , fs = require('fs')
  , token;

var doRoutine = function(){

  console.log('Routine started');

  function isElegible(filename) {
    var elegible = false;
    for(var i in config.extensions){
      if(filename.indexOf('.'+config.extensions[i]) > -1) elegible = true;
    }
    return elegible;
  }

  function getBaseName(filename) {
    for(var i in config.extensions)
      filename = filename.replace('.'+config.extensions[i], '');
    return filename;
  }

  function downloadSubtitle(filepath) {
    
    var filename = filepath.replace(/^.*[\\\/]/, '')
      , baseFilename = getBaseName(filename)
      , folder = filepath.replace(filename, '')
      , strPath = path.join(folder, baseFilename+'.'+config.lang+'.srt')

    if(fs.existsSync(strPath))
      fs.unlinkSync(strPath);    
    
    opensubtitles.api.searchForFile(token, config.lang, filepath)
    .then(function(results){
      console.log('Downloading '+filename);
      var r = request(results[0].SubDownloadLink)
      .on('response', function(response) {
          console.log('Done!');
      })
      .pipe(zlib.createGunzip())
      .pipe(fs.createWriteStream(strPath));      
    });

  }

  recursive(config.path, function (err, files) {
    for(var i in files)
      if(isElegible(files[i])) downloadSubtitle(files[i]);
  });

};

opensubtitles.api.login()
.then(function(_token){
  token = _token;
  console.log('Sucessfull login to Opensubtitles');
  doRoutine();
  setInterval(doRoutine, config.interval * 60 * 1000);
});