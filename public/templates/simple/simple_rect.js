(function() {
    dala.require('templateManager').registerTemplate('simple_rect', {
        description : "Simple rectangle with text",
        docking : {
            type: 'rect',
            orientation: 'center'
        },
        title : "RECTANGLE",
        color_main : "#FFFFFF",
        resize : [
            {bind:"#body_back", value:"default", min:"parent"},
            {bind:"#title_t", position: "center"}
        ],
        edit: {
            title : {
                type : "text",
                label : "Text",
                bind : "#title_span",
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