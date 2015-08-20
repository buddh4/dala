var ROOT_PROJECT_ID = 'root_projects';

var FileTreeBuilder = function(refreshHandler) {
    this.init();
    this.refreshHandler = refreshHandler;
};

FileTreeBuilder.prototype.init = function() {
    this.data = [];
    //Init root Project folder
    this.data.push({ "id" : ROOT_PROJECT_ID, "parent" : "#", "text" : "Projects", type:'root', state: { opened: true}});
};

FileTreeBuilder.prototype.projects = function(projectArr) {
    var that = this;
    $.each(projectArr, function(index, project) {
        that.addProject(project);
    });
    return this;
}

FileTreeBuilder.prototype.addProject = function(project, opened) {
    var projectId = project._id || project.id;
    var state = (opened) ? { opened: true} : {}
    this.data.push({
        "id"    : "project_"+projectId,
        "parent": ROOT_PROJECT_ID,
        "text"  :project.title,
        "type"  :"project",
        state: state
    });
    return this;
    //TODO: add diagrams / folder / subdiagram
};

FileTreeBuilder.prototype.addDiagram = function(projectId, diagram) {
    var projectNodeId = "project_"+projectId;
    this.data.push({
        "id": "diagram_"+diagram.id,
        "parent":projectNodeId,
        "text":diagram.label,
        "type":"diagram"
    });
    return this;
    //TODO: add diagrams / folder / subdiagram
};

FileTreeBuilder.prototype.refresh = function() {
    if(this.refreshHandler) {
        this.refreshHandler(this.data);
    }
};

module.exports = FileTreeBuilder


