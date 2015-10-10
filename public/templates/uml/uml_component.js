(function() {
    dala.require('templateManager').registerTemplate('uml_component', {
        description : "UML component",
        title : "component",
        head : "&lt;&lt;component&gt;&gt;",
        color_main : "#FFFFFF",
        color_second : "#000000",
        docking : {
            type: 'square',
            orientation: 'center'
        },
        resize : [
            {bind:"#body_back", value:"default", min:"parent"},
            {bind:"#head_t", position: "center static", alignto:"#body_back"},
            {bind:"#title_t", position: "center static", alignto:"#body_back"},
            {bind:"#icon", position: "right(5) static", alignto:"#body_back"}
        ],
        edit: {
            title : {
                type : "textarea",
                label : "Text",
                bind : "#title_t",
                trigger : "#title_t"
            },
            head : {
                type : "text",
                label : "Type",
                bind : "#head_span",
                trigger : "#head_t"
            },
            mainColor : {
                type : "color",
                label : "Main Color",
                bind : "#body_back"
            }
        }
    });
})();