
var assert = require('chai').assert;
mocha.setup('bdd');

//var stage = new dala.SVG('#stage');

describe('shapes', function() {
    it('test circle dimensions', function () {
        var c1 = stage.circle().r(5);
        assert.ok(c1);
        assert.equal(10, c1.height(), 'circle height without stroke');
        assert.equal(10, c1.width(), 'circle width without stroke');
        assert.equal(5, c1.r(), 'circle r without stroke');
        c1.stroke('green', 2);
        assert.equal(6, c1.r(), 'circle r with stroke');
        assert.equal(12, c1.height(), 'circle height with stroke');
        assert.equal(12, c1.width(), 'circle width with stroke');
        assert.equal(10, c1.height(false), 'circle height no stroke');
        assert.equal(10, c1.width(false), 'circle width no stroke');
        assert.deepEqual({x:0,y:0}, c1.getCenter());
        c1.move(10,10);
        assert.deepEqual({x:10,y:10}, c1.getCenter());
        c1.remove();
    });

    it('test rect dimensions', function () {
        //TODO: implement
        //var c1 = stage.rect().width(5).height(50).fill('#ffffff').draggable();
    });
});
