'use strict';

var packageName = 'gulp-source-map-unzip';

var through = require('through2'),
    gutil = require('gulp-util'),
    extend = require('xtend'),
    BufferStreams = require('bufferstreams'),
    applySourceMap = require('vinyl-sourcemaps-apply'),
    transfer = require('multi-stage-sourcemap').transfer,
    convert = require('convert-source-map'),
    fs = require('fs'),
    zlib = require('zlib');

var mergeSourceMap = function (inSourceMap, outSourceMap) {
    if (typeof outSourceMap === 'string' || outSourceMap instanceof String) {
        outSourceMap = JSON.parse(outSourceMap);
    }

    if (!inSourceMap) {
        return outSourceMap;
    }

    return JSON.parse(transfer({fromSourceMap: outSourceMap, toSourceMap: inSourceMap}));
}

var transform = function (file, encoding, opt) {
    var inMap = file.sourceMap;

    if (!inMap) {
        throw new gutil.PluginError(packageName, packageName + ' only works with source map input', {showStack: true});
    } else {
        var path = inMap.sources[0];
        var contents = inMap.sourcesContent[0];
        isZip(contents) && unzipSource(contents, path, opt);
    }
}

var isZip = function (contents) {
    var toPeek = Math.min(contents.length, 10);
    var peek = contents.substring(0, toPeek);
    return /[\x00-\x09\x0E-\x1F]/.test(peek);
}

var unzipSource = function (contents, path, options) {
    // using the pattern of copy & move, overwriting the original upon success

    var basePath = options['base'] || '';
    basePath = (basePath.length <= 1 || basePath[basePath.length - 1] == '/') ?
        basePath : basePath + '/';
    path = basePath + path;
    var intermediatePath = path + '.uz';

    var unzipper = zlib.createUnzip();
    var file = fs.createReadStream(path);
    var outFile = fs.createWriteStream(intermediatePath);
    var zip = file.pipe(unzipper);
    zip.on('data', function (data) {
        outFile.write(data);
    });
    zip.on('error', function (error) {
        console.log(error);
    });
    zip.on('end', function () {
        fs.renameSync(intermediatePath, path);
    });
}

module.exports = function (opt) {
    return through.obj(function (file, encoding, callback) {
        encoding = encoding || 'utf8';

        if (file.isNull()) {
            this.push(file);
        } else if (file.isBuffer()) {
            transform(file, encoding, opt);
            this.push(file);
        } else if (file.isStream()) {
            file.contents = file.contents.pipe(new BufferStreams(function (err, buf, cb) {
                if (err) {
                    cb(new gutil.PluginError(pluginName, err, {showStack: true}));
                } else {
                    cb(null, new Buffer(unzipSource(buf.toString(encoding), file.path, opt)));
                }
            }));
            this.push(file);
        }

        callback();
    });
};
