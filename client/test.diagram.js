var chai = require('chai');
chai.use(require('chai-as-promised'));
var assert = chai.assert;

var Promise = require('bluebird');

mocha.setup('bdd');

var diagram, n1, n2, n3, t1;

var n1Config = {x:10, y : 10};
var n2Config = {x:10, y : 100};
var n3Config = {x:300, y : 10};

describe('diagram', function() {
    it('create diagram', function (done) {
        diagram = new dala.Diagram({id:'testDiagram', container:'#stage', title: 'MyTestDiagram'});
        diagram.on('initialized', function() {
            assert.ok(diagram,'stage obj created');
            assert.equal('testDiagram', diagram.id, 'stage id assigned');
            assert.equal('MyTestDiagram', diagram.title, 'title assigned');
            assert.equal('default', diagram.projectId, 'default project id');
            assert.ok(diagram.$container, 'container node created');
            assert.ok(diagram.svg, 'svg obj for stage created');
            assert.equal(1, diagram.scale, 'scale initiated');
            assert.equal(1, diagram.getRootSVG().$('defs').length, 'svg defs created');
            assert.equal(1, diagram.getRootSVG().$().children('#stage_svg_main').length, 'svg main group created');
            done();
        });
    });
});

describe('template', function() {
    it('api: load remote template', function () {
        return assert.eventually.ok(diagram.api.loadTemplate('simple_rect'));
    });

    it('api: get (existing) template sync', function () {
       return assert.ok(diagram.templateMgr.getTemplateSync('simple_rect'));
    });
});

describe('node', function() {
    it('api: create nodes', function () {
        var p1 = diagram.api.createNode('simple_rect', n1Config);
        p1.then(function(node) {
            n1 = node;
        });

        var p2 = diagram.api.createNode('simple_rect', n2Config);
        p2.then(function(node) {
            n2 = node;
        });
        return Promise.all([assert.eventually.ok(p1), assert.eventually.ok(p2)]);
    });

    it('check created  nodes', function () {
        assert.ok(n1);
        assert.ok(n2);
        assert.equal(10, n1.x(),'x node1');
        assert.equal(10, n1.y(),'y node1');
        assert.equal(10, n2.x(),'x node2');
        assert.equal(100, n2.y(),'y node2');
    });

    it('check init  selection', function () {
        var selectedNodes = diagram.api.getSelectedNodes();
        assert.equal(1, selectedNodes.length ,'1 selected node after node creation');
        assert.equal(n2, selectedNodes[0],'last node is selected node');
    });

    it('node create command', function () {
        var p1 = new Promise(function(resolve, reject) {
            diagram.api.createNode('simple_rect', n3Config)
                .then(function(node) {
                    diagram.undoCommand();
                    var n = diagram.api.getNodeById(node.id);
                    var domNode = $('#'+node.id);
                    diagram.redoCommand();
                    n3 = diagram.api.getNodeById(node.id);
                    var domNode2 = $('#'+node.id);
                    resolve((!n && !domNode.length) && (n3 && domNode2.length));
                }, reject);
        });
        return assert.eventually.ok(p1);
    });

    it('node drag command', function () {
        n3.triggerDrag(10, -10);
        n3.trigger('dragEnd'); //Todo: We have to end the dragEvent manually in the api
        assert.deepEqual({x:310, y:0}, n3.position());
        diagram.undoCommand();
        assert.deepEqual({x:300, y:10}, n3.position());
    });

    it('node resize command', function () {
        var height = n3.height();
        var width = n3.width();
        n3.additions.resize.resizeNode(10, 10);
        assert.equal(height+10 , n3.height());
        assert.equal(width+10, n3.width());
        diagram.undoCommand();
        assert.equal(height , n3.height());
        assert.equal(width, n3.width());
    });

    it('node edit fill command', function () {
        var oldVal = n3.additions.edit.getValue('mainColor');
        n3.additions.edit.setValue('mainColor', 'blue');
        assert.equal('blue', n3.additions.edit.getValue('mainColor'));
        diagram.undoCommand();
        assert.equal(oldVal, n3.additions.edit.getValue('mainColor'));
    });
});

describe('transition', function() {
    it('api: check create  transition', function () {
        t1 = diagram.api.createTransition(n1,n2);
        assert.ok(t1, 'create transition');
        assert.equal(t1, diagram.api.getSelectedTransition(), 'select transition after creation');
        assert.equal(0, diagram.api.getSelectedNodes().length, 'deselect nodes after transition creation');
    });

    it('transition docking orientation position', function () {
        assert.deepEqual(n1.getCenter(), t1.dockingManager.startDocking.position(), 'start orientation is startNode center');
        assert.deepEqual(n2.getCenter(), t1.dockingManager.endDocking.position(), 'end orientation is startNode center');
    });

    it('transition docking position', function () {
        assert.deepEqual({x : n1.getCenter().x, y : n1.getBottomY()}, t1.start(), 'start of transition');
        assert.deepEqual({x : n2.getCenter().x, y : n2.y()}, t1.end(), 'end of transition');
    });

    it('transition command create', function () {
        var t2 = diagram.api.createTransition(n2,n3);
        var id = t2.id;
        assert.equal(1, $('#'+id).length);
        assert.ok(diagram.api.getTransitionById(id));
        diagram.undoCommand();
        assert.ok(t2.removed);
        assert.equal(0, $('#'+id).length);
        assert.isUndefined(diagram.api.getTransitionById(id));
        diagram.redoCommand();
        assert.equal(1, $('#'+id).length);
        assert.ok(diagram.api.getTransitionById(id));
        diagram.api.getTransitionById(id).remove();
    });

    it('transition command add knob', function () {
        var t2 = diagram.api.createTransition(n2,n3);
        var knobPosition = {x:n3.getCenter().x, y:n2.getCenter().y};
        var knob = t2.addKnob(knobPosition);
        assert.ok(knob);
        assert.equal(3, t2.knobManager.size());
        assert.deepEqual(knobPosition, t2.knobManager.getKnob(1).position());
        diagram.undoCommand();
        assert.equal(2, t2.knobManager.size());
        diagram.redoCommand();
        assert.equal(3, t2.knobManager.size());
        assert.deepEqual(knobPosition, t2.knobManager.getKnob(1).position());
        diagram.api.getTransitionById(t2.id).remove();
    });

    it('transition command add knob', function () {
        var t2 = diagram.api.createTransition(n2,n3);
        var knobPosition = {x:n3.getCenter().x, y:n2.getCenter().y};
        var knob = t2.addKnob(knobPosition);
        t2.knobManager.moveKnob(knob, 10, 10);
        assert.deepEqual({x: knobPosition.x + 10, y : knobPosition.y + 10}, knob.position());
        t2.knobManager.moveKnob(1, 10, 10);
        assert.deepEqual({x: knobPosition.x + 20, y : knobPosition.y + 20}, knob.position());
        diagram.undoCommand();
        diagram.undoCommand();
        assert.deepEqual(knobPosition, knob.position());
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