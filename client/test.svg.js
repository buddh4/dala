
var assert = require('chai').assert;
mocha.setup('bdd');

var stage = new dala.SVG('#stage');

describe('shapes', function() {
    it('test rect dimensions', function () {
        var r1 = stage.rect().height(30).width(50).translate(10,10);
        assert.ok(r1);
        assert.equal(30, r1.height(), 'rect height without stroke');
        assert.equal(50, r1.width(), 'rect width without stroke');
        assert.deepEqual({x:35, y:25}, r1.getCenter(), 'rect center no scale');
        assert.equal(60, r1.getRightX());
        assert.equal(40, r1.getBottomY());
        r1.stroke('green', 2);
        assert.equal(32, r1.height(true), 'rect height with stroke');
        assert.equal(52, r1.width(true), 'rect width with stroke');
        assert.deepEqual({x:35, y:25}, r1.getCenter(), 'rect center with stroke no scale');
        assert.equal(61, r1.getRightX(true), 'rect right x with stroke no scale');
        assert.equal(41, r1.getBottomY(true), 'rect buttom y with stroke no scale');
        r1.scale(2);
        assert.equal(60, r1.height(), 'rect height with stroke');
        assert.equal(64, r1.height(true), 'rect height with stroke');
        assert.equal(100, r1.width(), 'rect width with stroke');
        assert.equal(104, r1.width(true), 'rect width with stroke');
        assert.deepEqual({x:60, y:40}, r1.getCenter(), 'rect center with stroke scale');
        assert.equal(110, r1.getRightX(), 'rect right x with stroke scale');
        assert.equal(112, r1.getRightX(true), 'rect right x with stroke scale');

        stage.helper().point('rcenter', r1.getCenter(), 'red',true);
        stage.helper().point('rleftTopNoStr', r1.position(), 'red',true);
        stage.helper().point('rleftTopStr', r1.position(true), 'yellow',true);
        stage.helper().point('rrightTopNoStr', r1.topRight(), 'red',true);
        stage.helper().point('rrightTopStr', r1.topRight(true), 'yellow',true);
        stage.helper().point('rrightBotNoStr', r1.bottomRight(), 'red',true);
        stage.helper().point('rrightBotStr', r1.bottomRight(true), 'yellow',true);
        stage.helper().point('rleftBotNoStr', r1.bottomLeft(), 'red',true);
        stage.helper().point('rleftBotStr', r1.bottomLeft(true), 'yellow',true);

        //assert.equal(42, r1.getBottomY(true), 'rect buttom y with stroke no scale');
    });

    it('test circle dimensions', function () {
        var c1 = stage.circle().r(25);
        assert.ok(c1);
        assert.equal(50, c1.height(), 'circle height without stroke');
        assert.equal(50, c1.width(), 'circle width without stroke');
        assert.equal(25, c1.r(), 'circle r without stroke');
        assert.equal(25, c1.r(true), 'circle r without stroke');
        c1.stroke('green', 2);
        c1.move(200,35);
        assert.equal(25, c1.r(), 'circle r with stroke');
        assert.equal(26, c1.r(true), 'circle r with stroke');
        assert.equal(50, c1.height(), 'circle height with');
        assert.equal(52, c1.height(true), 'circle height with stroke');
        assert.equal(50, c1.width(), 'circle width');
        assert.equal(52, c1.width(true), 'circle width with stroke');
        assert.deepEqual({x:200,y:35}, c1.getCenter(), 'circle center no scale');
        c1.scale(2);
        assert.deepEqual({x:200,y:35}, c1.getCenter(), 'circle center no scale');
        assert.equal(50, c1.r(), 'circle r with strokeand scale');
        assert.equal(52, c1.r(true), 'circle r with stroke and scale');
        assert.equal(100, c1.height(), 'circle height stroke and scale');
        assert.equal(104, c1.height(true), 'circle height and scale');
        assert.equal(100, c1.width(), 'circle width and scale');
        assert.equal(104, c1.width(true), 'circle width and scale');
        c1.move(0,20);

        //TODO: position with and without stroke
        stage.helper().point('ccenter', c1.getCenter(), 'red',true);
    });

    it('test scale', function () {
        var r2 = stage.rect().height(2).width(10);
        r2.scale(1.2, 1);
        assert.equal(12, r2.width());
        var ratio = 1 / 10;
        var newScale = 1.2 + ratio;
        r2.scale(newScale, 1);
        assert.equal(13, r2.width());
        r2.remove();
    });

    it('test append element', function () {
        var g = stage.g();
        var rect = g.append(stage.rect({id:'innerRect'}).height(500).width(500));
        assert.equal(1, g.$().children('#innerRect').length);
        assert.ok(rect);
        g.remove();
    });

});

mocha.run();
