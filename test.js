/*jshint laxbreak:true */

var assert = require('assert');
var metadata = require('./index');

describe('metadata.cmd()', function() {
  it('returns command without exif data', function() {
    var cmd = 'identify -format "name=%[name]\nsize=%[size]\nformat=%m\n'
            + 'colorspace=%[colorspace]\nheight=%[height]\nwidth=%[width]\n'
            + 'orientation=%[orientation]\n" /foo/bar/baz';

    assert.equal(metadata.cmd('/foo/bar/baz'), cmd);
  });

  it('returns command with exif data', function() {
    var cmd = 'identify -format "name=%[name]\nsize=%[size]\nformat=%m\n'
            + 'colorspace=%[colorspace]\nheight=%[height]\nwidth=%[width]\n'
            + 'orientation=%[orientation]\n%[exif:*]" /foo/bar/baz';

    assert.equal(metadata.cmd('/foo/bar/baz', {exif: true}), cmd);
  });
});

describe('metadata.parse()', function() {
  var path = '/foo/bar/baz.jpg';

  it('returns object for single value', function() {
    assert.deepEqual(metadata.parse(path, 'foo=bar'), {
      path: path,
      foo: 'bar'
    });
  });

  it('returns object for metadata string', function() {
    assert.deepEqual(metadata.parse(path, 'foo=bar\nbar=foo'), {
      path: path,
      foo: 'bar',
      bar: 'foo'
    });
  });

  it('skips empty lines', function() {
    assert.deepEqual(metadata.parse(path, 'foo=bar\n\nbar=foo\n\n'), {
      path: path,
      foo: 'bar',
      bar: 'foo'
    });
  });

  it('returns correct size for bogus value', function() {
    assert.deepEqual(metadata.parse(path, 'size=4.296MBB'), {
      path: path,
      size: '4.296MB'
    });
  });

  it('returns RGB for sRGB colorspace', function() {
    assert.deepEqual(metadata.parse(path, 'colorspace=sRGB'), {
      path: path,
      colorspace: 'RGB'
    });
  });

  it('return "" for Undefined orientation', function() {
    assert.deepEqual(metadata.parse(path, 'orientation=Undefined'), {
      path: path,
      orientation: ''
    });
  });

});

describe('metadata()', function() {
  it('returns metadata for image', function(done) {
    metadata('./assets/image.jpg', { exif: false }, function(err, data) {
      assert.ifError(err);

      assert.equal(data.path, './assets/image.jpg');
      assert.equal(data.name, '');
      assert.equal(data.size, '4.296MB');
      assert.equal(data.format, 'JPEG');
      assert.equal(data.colorspace, 'RGB');
      assert.equal(data.height, 3456);
      assert.equal(data.width, 5184);

      // Ok, I give up. For some reason there is this inconsistency between
      // ImageMagick identify versions which yilds undefined/empty string for
      // the orientation on the CI server. I can not find any reference on this
      // issue which is why this test will not be run on the CI server.
      if (!process.env.CI) { assert.equal(data.orientation, 'TopLeft'); }

      assert.equal(typeof data.exif, 'undefined');

      done();
    });
  });

  it('returns metadata for image with exif data', function(done) {
    metadata('./assets/image.jpg', { exif: true }, function(err, data) {
      assert.ifError(err);

      assert.equal(data.path, './assets/image.jpg');
      assert.equal(data.name, '');
      assert.equal(data.size, '4.296MB');
      assert.equal(data.format, 'JPEG');
      assert.equal(data.colorspace, 'RGB');
      assert.equal(data.height, 3456);
      assert.equal(data.width, 5184);

      // Ok, I give up. For some reason there is this inconsistency between
      // ImageMagick identify versions which yilds undefined/empty string for
      // the orientation on the CI server. I can not find any reference on this
      // issue which is why this test will not be run on the CI server.
      if (!process.env.CI) { assert.equal(data.orientation, 'TopLeft'); }

      assert.equal(typeof data.exif, 'object');
      assert.equal(Object.keys(data.exif).length, 36);
      assert.equal(data.exif.ApertureValue, '37/8');

      done();
    });
  });
});
