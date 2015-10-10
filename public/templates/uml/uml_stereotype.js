(function() {
    dala.require('templateManager').registerTemplate('uml_stereotype', {
        init_width : "150",
        init_title : "New Class",
        color_main : "#FFFFFF",
        color_second : "#FFFFFF",
        color_hover : "#E0E0E0",
        color_select: "#898989",
        docking : {
            type: 'square',
            orientation: 'center'
        },
        resize: [
            {bind:"#methods_back", value:"default", min:"parent"},
            {bind:"#attributes_back", value:"default parent", min:"parent"},
            {bind:"#methods_g", position: "static relative(0)"},
            {bind:"#node_back", value:"default parent(5)", min:"parent"},
            {bind:"#methods_back", min:"#node_back none"},
            {bind:"#attributes_back", min:"#node_back none"},
            {bind:"#stereotype_t", position: "center static", alignto:"#node_back"},
            {bind:"#title_t", position: "center static", alignto:"#node_back"}
        ],
        edit: {
            stereotype : {
                type : "text",
                label : "Stereotype",
                bind : "#stereotype_span",
                trigger : "#stereotype_t"
            },
            title : {
                type : "text",
                label : "Title",
                bind : "#title_span",
                trigger : "#title_t"
            },
            attributes : {
                type : "textarea",
                label : "Attributes",
                bind : "#attributes_t",
                trigger : ["#attributes_back", "#attributes_t"]
            },
            methods : {
                type : "textarea",
                label : "Methods",
                bind : "#methods_t",
                trigger : ["#methods_back", "#methods_t"]
            },
            mainColor : {
                type : "color",
                label : "Main Color",
                bind : "#node_back"
            }
        }
    });
})();