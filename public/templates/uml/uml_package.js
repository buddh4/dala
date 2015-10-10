(function() {
    dala.require('templateManager').registerTemplate('uml_package', {
        title : "New Package",
        color_main : "#FFFFFF",
        docking : {
            type: 'square',
            orientation: 'center'
        },
        resize : [
            {bind:"#body_back", value:"default", min:"parent parent(-10)"},
            {bind:"#title_t", position:"center static", alignto:"#body_back"}
        ],
        edit: {
            title : {
                type : "textarea",
                label : "Text",
                bind : "#title_t",
                trigger : "#title_t"
            },
            mainColor : {
                type : "color",
                label : "Main Color",
                bind : "#body_back"
            }
        }
    });
})();