var string = require('../util/string');
var Promise = require('bluebird');
var currentUrl;

var suffixMapping = {
    'image/jpeg': 'jpg' ,
    'image/gif': 'gif',
    'image/png' : 'png',
    'image/svg+xml' : 'svg'
};

var getFileNameWithSuffix = function(fileName, mime) {
    var suffix = suffixMapping[mime];
    if(suffix) {
        return (string.endsWith(fileName, suffix)) ? fileName : fileName + '.'+suffix;
    }
    return fileName;
}

module.exports = {
    downloadSVG: function(data, fileName) {
        if(currentUrl) {
            window.URL.revokeObjectURL(currentUrl);
        }

        fileName = getFileNameWithSuffix(fileName, 'image/svg+xml');

        window.URL = window.URL || window.webkitURL;
        var blob = new Blob([data], {type: 'image/svg+xml'});

        currentUrl = window.URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = currentUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
    },
    downloadAs : function(data, fileName, width, height, mime) {
        if(mime === 'image/svg+xml') {
            this.downloadSVG(data, fileName);
            return;
        }

        fileName = getFileNameWithSuffix(fileName, mime);

        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        document.body.appendChild(canvas);
        canvas.width  = width;
        canvas.height = height;

        var img = new Image();
        img.src = "data:image/svg+xml;base64," + btoa(data);
        img.width = width;
        img.height = height;
        img.onload = function() {
            // after this, Canvas’ origin-clean is DIRTY
            context.drawImage(img, 0, 0, width, height);
            var a = document.createElement('a');
            a.download = fileName;
            a.href = canvas.toDataURL(mime);
            document.body.appendChild(a);
            a.click();
            canvas.remove();
            a.remove();
        }
    },
    makeScreenShot : function(container, svgStr, width, height) {
        var img = new Image();
        img.src = "data:image/svg+xml;base64," + btoa(svgStr);
        if(width && height) {
            img.width = width;
            img.height = height;
        }
        $(container).append(img);
    },
    handleOpenSVG: function(file) {
        //var files = evt.target.files; // FileList object
        var that = this;
        // Loop through the FileList and render image files as thumbnails.
        for (var i = 0, f; f = files[i]; i++) {

            // Only process image files.
            if (!f.type.match('image.*')) {
                continue;
            }

            var reader = new FileReader();

            // Closure to capture the file information.
            reader.onload = (function (theFile) {
                return function (e) {
                    // Render thumbnail.
                    that.diagram.loadDiagram(e.target.result);
                };
            })(f);

            // Read in the image file as a data URL.
            reader.readAsText(f);
        }
    },
    readAsText: function(f) {
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();

            reader.onload = (function (theFile) {
                return function (e) {
                    resolve(e.target.result);
                };
            })(f);

            reader.readAsText(f);
        });
    },
    readAsDataUrl: function(f) {
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();

            reader.onload = (function (theFile) {
                return function (e) {
                    resolve(e.target.result);
                };
            })(f);

            reader.readAsDataURL(f);
        });
    }
};