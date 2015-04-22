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
  it('returns object for single value', function() {
    assert.deepEqual(metadata.parse('foo=bar'), {
      foo: 'bar'
    });
  });

  it('returns object for metadata string', function() {
    assert.deepEqual(metadata.parse('foo=bar\nbar=foo'), {
      foo: 'bar',
      bar: 'foo'
    });
  });

  it('skips empty lines', function() {
    assert.deepEqual(metadata.parse('foo=bar\n\nbar=foo\n\n'), {
      foo: 'bar',
      bar: 'foo'
    });
  });

  it('returns correct size for bogus value', function() {
    assert.deepEqual(metadata.parse('size=4.296MBB'), {
      size: '4.296MB'
    });
  });

  it('returns RGB for sRGB colorspace', function() {
    assert.deepEqual(metadata.parse('colorspace=sRGB'), {
      colorspace: 'RGB'
    });
  });
});

describe('metadata()', function() {
  it('returns metadata for image', function(done) {
    metadata('./image.jpg', { exif: true }, function(err, data) {
      assert.ifError(err);

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

      done();
    });
  });
});
