var event = require('../core/event');
var stringUtil = require('../util/string');

var $CONTAINER_NODE = $('#fileBrowser');
var $TREE_NODE = $('#fileSystem');

var initListener = function() {
    event.listen('user_loggedin', userLoginListener);
    event.listen('diagram_initialized', diagramInitializedListener);
    event.listen('diagram_updated', diagramUpdatedListener);
}

var diagramUpdatedListener = function(evt) {
    var diagramId = evt.data;
    var diagramNodeId = 'diagram_'+diagramId;

    var text = $TREE_NODE.jstree(true).get_text(diagramNodeId);
    if(!stringUtil.endsWith(text, '*')) {
        $TREE_NODE.jstree(true).rename_node(diagramNodeId, text+'*');
    }

};

var diagramInitializedListener = function(evt) {
    var projectId = evt.data.projectId || 'default';
    var projectNodeId = "project_"+projectId;
    var diagramId = evt.data.diagramId;
    var label = evt.data.label;
    var test = $TREE_NODE.jstree(true).settings.core.data;

    $TREE_NODE.jstree(true).settings.core.data.push({
        "id": "diagram_"+diagramId,
        "parent":projectNodeId,
        "text":label,
        "type":"diagram"
    });


    $TREE_NODE.jstree(true).open_node(projectNodeId);
    $TREE_NODE.jstree(true).refresh();
}

var userLoginListener = function(evt) {
    var projectData = evt.data.projects;
    if(!projectData) {
        //Todo: Load from server
    } else {
        var data = [];
        data.push({ "id" : "root_projects", "parent" : "#", "text" : "Projects", type:'root', state: { opened: true}});
        $.each(projectData, function(index, project) {
            data.push({
                "id": "project_"+project._id,
                "parent":'projects',
                "text":project.title,
                "type":"folder"
            })
        });

        updateTreeData(data);
    }
};

var updateTreeData = function(data) {
    $TREE_NODE.jstree(true).settings.core.data = data;
    $TREE_NODE.jstree(true).refresh();
    $CONTAINER_NODE.accordion( "refresh" );
}

var getProjectContextMenu = function(projectId) {
    return {
        "New Diagram": {
            "label": "New Diagram",
            "action": function (obj) {
                event.trigger('tab_new', projectId);
            }
        }
        //TODO: DELETE / CLOSE PROJECT / RENAME / NEW FOLDER
    };
}


module.exports.init = function() {
    $CONTAINER_NODE.accordion({collapsible: true});

    $TREE_NODE.jstree({
        'core' : {
            'check_callback': function(operation, node, node_parent, node_position, more) {
                // operation can be 'create_node', 'rename_node', 'delete_node', 'move_node' or 'copy_node'
                // in case of 'rename_node' node_position is filled with the new node name

               /* if (operation === "move_node") {
                    return node_parent.original.type === "root"; //only allow dropping inside nodes of type 'Parent'
                }*/
                return true;  //allow all other operations
            }
        },
        "plugins": ["contextmenu", "types", "sort", "dnd"],
        "types" : {
            "root" : {
                "icon" : "/images/icons/folder.png",
                "valid_children " : ['project']
            },
            "project" : {
                "icon": "/images/icons/folder.png"
            },
            "diagram" : {
                "icon": "/images/icons/file.png",
                "max_children" : 0
            }
        },
        "contextmenu": {
            "items": function (node) {
                var idSplitted = node.id.split('_');
                var type = idSplitted[0];
                var id = idSplitted[1];
                switch(type) {
                    case 'project':
                        return getProjectContextMenu(id);
                        break;
                    case 'diagram':
                        break;
                    case 'root':
                        break;
                }
            }
        }
    });

    updateTreeData( [
        { "id" : "root_projects", "parent" : "#", "text" : "Projects", state: { opened: true}, type : 'root' },
        { "id" : "project_default", "parent" : "root_projects", "text" : "default", type: 'project' }
    ]);

    $TREE_NODE.on('redraw.jstree after_open.jstree after_close.jstree', function(e) {
        $CONTAINER_NODE.accordion( "refresh" );
    });

    $TREE_NODE.on('changed.jstree', function(evt,data) {
        //Single selection
        var id = data.selected[0];

    });

    $(document)
        .on('dnd_move.vakata', function (e, data) {
            var t = $(data.event.target);
            if(!t.closest('.jstree').length) {
                if(t.closest('#diagramStage').length) {
                    var test = data.helper.find('.jstree-icon');
                    data.helper.find('.jstree-icon').removeClass('jstree-er').addClass('jstree-ok');
                    // Stop the jstree handlers since we don't need them for outter tree drag / drops
                    // Furthermore they would change the helper class again.
                    e.stopImmediatePropagation();
                }
            }
        })
        .on('dnd_stop.vakata', function (e, data) {
            var t = $(data.event.target);
            if(!t.closest('.jstree').length) {
                if(t.closest('#diagramStage').length) {
                    console.log('asdfasdf');
                    // node data:
                    // if(data.data.jstree && data.data.origin) { console.log(data.data.origin.get_node(data.element); }
                }
            }
        });

    initListener();
}
