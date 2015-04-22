var exec = require('child_process').exec, child;

module.exports = function(src, opts, cb) {
  if (!cb) {
    cb = opts;
    opts = {};
  }

  var cmd = module.exports.cmd(src, opts);
  opts.timeout = opts.timeout || 5000;

  exec(cmd, opts, function(e, stdout, stderr) {
    if (e) { return cb(e); }
    if (stderr) { return cb(new Error(stderr)); }

    return cb(null, module.exports.parse(stdout));
  });
};

module.exports.cmd = function(src, opts) {
  opts = opts || {};
  var format = [
    'name=%[name]',
    'size=%[size]',
    'format=%m',
    'colorspace=%[colorspace]',
    'height=%[height]',
    'width=%[width]',
    'orientation=%[orientation]',
    (opts.exif ? '%[exif:*]' : '')
  ].join("\n");

  return 'identify -format "' + format + '" ' + src;
};

module.exports.parse = function(metadata) {
  var lines = metadata.split('\n'), ret = {}, i;

  for (i = 0; i < lines.length; i++) {
    if (lines[i]) {
      lines[i] = lines[i].split('=');
      ret[lines[i][0]] = lines[i][1];
    }
  }

  if (ret.width) { ret.width = parseInt(ret.width, 10); }
  if (ret.height) { ret.height = parseInt(ret.height, 10); }
  if (ret.size && ret.size.substr(ret.size.length - 2) === "BB") {
    ret.size = ret.size.substr(0, ret.size.length - 1);
  }

  return ret;
};
