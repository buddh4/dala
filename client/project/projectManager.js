var client = require('../core/client');
var event = require('../core/event');

var projects = {};
var projectManager

var initListener = function() {
    //event.listen('user_loggedin', userLoginListener);
    event.listen('project_create', newProjectListener);
};

var newProjectListener = function(evt) {
    var projectSettings = evt.data;

    if(projectSettings && projectSettings.title) {
        client.post('/project/createProject', projectSettings, {
            success : function(response) {
                var newProject = response.data.result;
                projects[newProject._id] = newProject;
                event.trigger('project_created', newProject);
            },
            errorMessage : 'Could not create project !',
            successMessage : 'Project created !'
        })
    }
};

module.exports = {
    init : initListener
};

