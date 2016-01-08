(function() {
    dala.require('templateManager').registerTemplate('network_file', {
        description : "File Icon",
        title : "File",
        color_main : "#000000",
        docking : {
            type: 'rect',
            orientation: 'center'
        },
        resize : [
            {bind:"root", value:"scale"}
        ],
        edit: {
            color : {
                type : "color",
                label : "Color",
                bind : "path"
            }
        }
    });
})();