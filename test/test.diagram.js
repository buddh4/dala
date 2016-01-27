var chai = require('chai');
chai.use(require('chai-as-promised'));
var assert = chai.assert;

var Promise = require('bluebird');

mocha.setup('bdd');

var diagram, n1, n2, t1;

var n1Config = {x:10, y : 10};
var n2Config = {x:10, y : 100};

before(function(done) {
    diagram = new dala.Diagram({id:'testDiagram', container:'#stage', title: 'MyTestDiagram'});
    diagram.on('initialized', function() {
        diagram.loadTemplate('simple_rect');
        done();
    });
});

beforeEach(function(done) {
    diagram.createNode('simple_rect', n1Config).then(function(node) {
        n1 = node;
        diagram.createNode('simple_rect', n2Config).then(function(node) {
            n2 = node;
            t1 = diagram.createTransition(n1,n2);
            done();
        });
    });
});

var resultDivs = {};

afterEach(function() {
    var testId = this.currentTest.title.split(':')[0]+'_svgResult';
    var div = $('<div id="'+testId+'"></div>');
    resultDivs[testId] = div;
    diagram.screenShot(div[0], true);
    diagram.clear();
});

after(function() {
    $('.test').each(function() {
        var testId = $(this).find('h2').text().split(':')[0]+'_svgResult';
        $(this).find('pre').append(resultDivs[testId]);
    });

});

describe('DI: Diagram Tests', function() {
    it('DI0001: Create Diagram', function () {
        assert.ok(diagram,'Diagram Initialzed');
        assert.equal('testDiagram', diagram.id, 'Stage id set');
        assert.equal('MyTestDiagram', diagram.title, 'Title set');
        assert.equal('default', diagram.projectId, 'Default project id set');
        assert.ok(diagram.$container, 'Container node set');
        assert.ok(diagram.svg, 'SVG obj for stage created');
        assert.equal(1, $('#stage_svg').length, 'SVG stage element appended');
        assert.equal(1, $('#stage_svg_background').length, 'Background Part appended');
        assert.equal(1, $('#stage_svg_main').length, 'Main Part appended');
        assert.equal(1, diagram.scale, 'scale initiated');
        assert.equal(1, diagram.getRootSVG().$('defs').length, 'Defs initialized');
        assert.equal(1, diagram.getRootSVG().$().children('#stage_svg_main').length, 'svg main group created');
    });
});

describe('TE: Template Tests', function() {
    it('TE0002: Register Template', function () {
        diagram.templateMgr.registerTemplate('test_tmpl', {
            svg: '<rect id="{node_id}" transform="translate({x} {y}) height="50" width="50" style="fill:green;" />'
        });
        assert.ok(diagram.templateMgr.getTemplateSync('test_tmpl'));
    });

    it('TE0001: Load Remote Template', function () {
        return assert.eventually.ok(diagram.loadTemplate('simple_circle'));
    });
});

describe('NO: Node Tests', function() {
    it('NO0001: Create Node', function () {
        assert.ok(n1, 'Create Node 1');
        assert.ok(n2, 'Create Node 2');
    });

    it('NO0001-1: Create Node - Init Position', function () {
        assert.ok(n1);
        assert.ok(n2);
        assert.equal(10, n1.x(),'x node1');
        assert.equal(10, n1.y(),'y node1');
        assert.equal(10, n2.x(),'x node2');
        assert.equal(100, n2.y(),'y node2');
    });

    it('NO0001-2: Create Node - Init Selection', function (done) {
        diagram.createNode('simple_rect', {x:100, y : 100}).then(function(node) {
            var selectedNodes = diagram.getSelectedNodes();
            assert.ok(node.selected, 'new node is selected');
            assert.equal(1, selectedNodes.length ,'selectionmanager contains new selected node');
            assert.equal(node, selectedNodes[0],'only selected node is new node');
            done();
        });
    });

    it('NO0001-4: Create Node - Undo' , function () {
        var p1 = new Promise(function(resolve, reject) {
            diagram.createNode('simple_rect', {x:300, y : 10})
                .then(function(node) {
                    diagram.undoCommand();
                    var n = diagram.getNodeById(node.id);
                    var domNode = $('#'+node.id);
                    diagram.redoCommand();
                    var n3 = diagram.getNodeById(node.id);
                    var domNode2 = $('#'+node.id);
                    resolve((!n && !domNode.length) && (n3 && domNode2.length));
                }, reject);
        });
        return assert.eventually.ok(p1);
    });

    it('NO0004: Drag Node (Do/Undo)', function () {
        n2.triggerDrag(10, -10);
        n2.trigger('dragEnd'); //Todo: We have to end the dragEvent manually in the api
        assert.deepEqual({x:20, y:90}, n2.position());
        diagram.undoCommand();
        assert.deepEqual({x:10, y:100}, n2.position());
        diagram.redoCommand();
        assert.deepEqual({x:20, y:90}, n2.position());
    });

    it('NO0007: Resize node (Do/Undo)', function () {
        var height = n2.height();
        var width = n2.width();
        n2.additions.resize.resizeNode(10, 10);
        assert.equal(height+10 , n2.height());
        assert.equal(width+10, n2.width());
        diagram.undoCommand();
        assert.equal(height , n2.height());
        assert.equal(width, n2.width());
        diagram.redoCommand();
        assert.equal(height+10 , n2.height());
        assert.equal(width+10, n2.width());
    });

    it('NO0006: Node Edit - fill (Do/Undo)', function () {
        var oldVal = n2.additions.edit.getValue('mainColor');
        n2.additions.edit.setValue('mainColor', 'blue');
        assert.equal('blue', n2.additions.edit.getValue('mainColor'));
        diagram.undoCommand();
        assert.equal(oldVal, n2.additions.edit.getValue('mainColor'));
        diagram.redoCommand();
        assert.equal('blue', n2.additions.edit.getValue('mainColor'));
    });

    it('NO0006-1: Node Edit - stroke (Do/Undo)', function () {
        var oldVal = n2.additions.edit.getValue('stroke');
        n2.additions.edit.setValue('stroke', 'blue');
        assert.equal('blue', n2.additions.edit.getValue('stroke'));
        diagram.undoCommand();
        assert.equal(oldVal, n2.additions.edit.getValue('stroke'));
        diagram.redoCommand();
        assert.equal('blue', n2.additions.edit.getValue('stroke'));
    });

    it('NO0006-2: Node Edit - stroke-width by direct edit mapping (Do/Undo)', function () {
        var oldVal = n2.additions.edit.getValue('stroke:stroke-width');
        n2.additions.edit.setValue('stroke:stroke-width', 2);
        assert.equal(2, n2.additions.edit.getValue('stroke:stroke-width'));
        diagram.undoCommand();
        assert.equal(oldVal, n2.additions.edit.getValue('stroke:stroke-width'));
        diagram.redoCommand();
        assert.equal(2, n2.additions.edit.getValue('stroke:stroke-width'));
    });

    it('NO0006-3: Node Edit - stroke-width (Do/Undo)', function () {
        var oldVal = n2.additions.edit.getValue('strokeWidth');
        n2.additions.edit.setValue('strokeWidth', 2);
        assert.equal(2, n2.additions.edit.getValue('strokeWidth'));
        diagram.undoCommand();
        assert.equal(oldVal, n2.additions.edit.getValue('strokeWidth'));
        diagram.redoCommand();
        assert.equal(2, n2.additions.edit.getValue('strokeWidth'));
    });

    it('NO0006-4: Node Edit - text (Do/Undo)', function () {
        var oldVal = n2.additions.edit.getValue('title');
        n2.additions.edit.setValue('title', 'TestText');
        assert.equal('TestText', n2.additions.edit.getValue('title'));
        diagram.undoCommand();
        assert.equal(oldVal, n2.additions.edit.getValue('title'));
        diagram.redoCommand();
        assert.equal('TestText', n2.additions.edit.getValue('title'));
    });

    it('NO0006-5: Node Edit - text-size (Do/Undo)', function () {
        var oldVal = n2.additions.edit.getValue('title:text-size');
        n2.additions.edit.setValue('title:text-size', 15);
        assert.equal(15, n2.additions.edit.getValue('title:text-size'));
        diagram.undoCommand();
        assert.equal(oldVal, n2.additions.edit.getValue('title:text-size'));
        diagram.redoCommand();
        assert.equal(15, n2.additions.edit.getValue('title:text-size'));
    });

    it('NO0010: Node Move Up Single Node' , function (done) {
        diagram.createNode('simple_rect', {x:100, y : 100})
            .then(function(node) {
                var nodeIndex = node.index();
                assert.ok((nodeIndex > n1.index()), 'New node over older node n1');
                assert.ok((nodeIndex > n2.index()), 'New node over older node n2');
                assert.ok((nodeIndex > t1.index()), 'New node over older transition t1');
                n2.moveUp();
                nodeIndex = node.index();
                assert.ok((nodeIndex < n2.index()), 'New node under n2 after n1 moveup');
                assert.ok((nodeIndex < t1.index()), 'New node under t1 after n1 moveup');
                done();
            });
    });

    it('NO0010-1: Node Move Down Single Node' , function (done) {
        diagram.createNode('simple_rect', {x:100, y : 100})
            .then(function(node) {
                node.moveDown();
                var nodeIndex = node.index();
                assert.ok((nodeIndex < n2.index()), 'New node under n2');
                assert.ok((nodeIndex < t1.index()), 'New node under t1');
                assert.ok((nodeIndex > n1.index()), 'New node over n2');
                node.moveDown();
                nodeIndex = node.index();
                assert.ok((nodeIndex < n2.index()), 'New node under n2');
                assert.ok((nodeIndex < t1.index()), 'New node under t1');
                assert.ok((nodeIndex < n1.index()), 'New node under n2');
                done();
            });
    });

    it('NO0010-2: Node Move Down Multi Select' , function (done) {
        diagram.createNode('simple_rect', {x:100, y : 100})
            .then(function(node3) {
                diagram.createNode('simple_rect', {x:100, y : 100})
                    .then(function(node4) {
                        node3.select(true);
                        diagram.event.trigger('node_movedown');
                        assert.ok((node3.index() < n2.index()), 'node3 under n2');
                        assert.ok((node3.index() < t1.index()), 'node3 under t1');
                        assert.ok((node3.index() > n1.index()), 'node3 over n1');
                        assert.ok((node4.index() < n2.index()), 'node4 under n2');
                        assert.ok((node4.index() < t1.index()), 'node4 under t1');
                        assert.ok((node4.index() > n1.index()), 'node4 over n1');
                        assert.ok((node3.index() < node4.index()), 'node3 under node4');
                        diagram.event.trigger('node_movedown');
                        assert.ok((node3.index() < n2.index()), 'node3 under n2');
                        assert.ok((node3.index() < t1.index()), 'node3 under t1');
                        assert.ok((node3.index() < n1.index()), 'node3 under n1');
                        assert.ok((node4.index() < n2.index()), 'node4 under n2');
                        assert.ok((node4.index() < t1.index()), 'node4 under t1');
                        assert.ok((node4.index() < n1.index()), 'node4 over n1');
                        assert.ok((node3.index() < node4.index()), 'node3 under node4');
                        done();
                });

            });
    });

    it('NO0010-3: Node Move Up Multi Select' , function (done) {
        diagram.createNode('simple_rect', {x:100, y : 100})
            .then(function(node3) {
                diagram.createNode('simple_rect', {x:100, y : 100})
                    .then(function(node4) {
                        n1.select();
                        n2.select(true);
                        diagram.event.trigger('node_moveup');
                        assert.ok((node3.index() < n2.index()), 'node3 under n2');
                        assert.ok((node3.index() < t1.index()), 'node3 under t1');
                        assert.ok((node3.index() < n1.index()), 'node3 under n1');
                        assert.ok((node4.index() > n2.index()), 'node4 over n2');
                        assert.ok((node4.index() > t1.index()), 'node4 over t1');
                        assert.ok((node4.index() > n1.index()), 'node4 over n1');
                        assert.ok((node3.index() < node4.index()), 'node3 under node4');
                        diagram.event.trigger('node_moveup');
                        assert.ok((node3.index() < n2.index()), 'node3 under n2');
                        assert.ok((node3.index() < t1.index()), 'node3 under t2');
                        assert.ok((node3.index() < n1.index()), 'node3 under t1');
                        assert.ok((node4.index() < n2.index()), 'node4 under n2');
                        assert.ok((node4.index() < t1.index()), 'node4 under t1');
                        assert.ok((node4.index() < n1.index()), 'node4 under n1');
                        assert.ok((node3.index() < node4.index()), 'node3 under node4');
                        done();
                    });

            });
    });
});

describe('TR: Transition', function() {
    it('TR0001: Create Transition', function () {
        t1 = diagram.createTransition(n1,n2);
        assert.ok(t1, 'create transition');
        assert.equal(t1, diagram.getSelectedTransition(), 'select transition after creation');
        assert.equal(0, diagram.getSelectedNodes().length, 'deselect nodes after transition creation');
    });

    it('TR0001-1: Create Transition - (DO/UNDO)', function () {
        var t2 = diagram.createTransition(n2,n1);
        var id = t2.id;
        assert.equal(1, $('#'+id).length);
        assert.ok(diagram.getTransitionById(id));
        diagram.undoCommand();
        assert.ok(t2.removed);
        assert.equal(0, $('#'+id).length);
        assert.isUndefined(diagram.getTransitionById(id));
        diagram.redoCommand();
        assert.equal(1, $('#'+id).length);
        assert.ok(diagram.getTransitionById(id));
    });

    it('TR0008: Transition Orientation - orientation init position', function () {
        assert.deepEqual(n1.getCenter(), t1.dockingManager.startDocking.position(), 'start orientation is startNode center');
        assert.deepEqual(n2.getCenter(), t1.dockingManager.endDocking.position(), 'end orientation is startNode center');
    });

    it('TR0009: Transition Docking - docking init position', function () {
        assert.deepEqual({x : n1.getCenter().x, y : n1.getBottomY()}, t1.start(), 'start of transition');
        assert.deepEqual({x : n2.getCenter().x, y : n2.y()}, t1.end(), 'end of transition');
    });

    it('TR0007: Inner Transition Knobs - add (DO/Undo)', function (done) {
        diagram.createNode('simple_rect', {x:300, y : 10})
            .then(function(node) {
                var t2 = diagram.createTransition(n2,node);
                var knobPosition = {x:node.getCenter().x, y:n2.getCenter().y};
                var knob = t2.addKnob(knobPosition);
                assert.ok(knob);
                assert.equal(3, t2.knobManager.size());
                assert.deepEqual(knobPosition, t2.knobManager.getKnob(1).position());
                diagram.undoCommand();
                assert.equal(2, t2.knobManager.size());
                diagram.redoCommand();
                assert.equal(3, t2.knobManager.size());
                assert.deepEqual(knobPosition, t2.knobManager.getKnob(1).position());
                diagram.getTransitionById(t2.id).remove();
                done();
            });
    });

    it('TR0007-1: Inner Transition Knobs - drag (DO/Undo)', function (done) {
        diagram.createNode('simple_rect', {x:300, y : 10})
            .then(function(node) {
                var t2 = diagram.createTransition(n2, node);
                var knobPosition = {x: node.getCenter().x, y: n2.getCenter().y};
                var knob = t2.addKnob(knobPosition);
                t2.knobManager.moveKnob(knob, 10, 10);
                assert.deepEqual({x: knobPosition.x + 10, y: knobPosition.y + 10}, knob.position());
                t2.knobManager.moveKnob(1, 10, 10);
                assert.deepEqual({x: knobPosition.x + 20, y: knobPosition.y + 20}, knob.position());
                diagram.undoCommand();
                diagram.undoCommand();
                assert.deepEqual(knobPosition, knob.position());
                done();
            });
    });

    /*
    it('transition edit', function () {
        //TODO: node edit
    });

    it('transition commands', function () {
        //TODO: node commands
    });*/
});

mocha.run();