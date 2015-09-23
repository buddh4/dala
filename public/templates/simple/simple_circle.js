(function() {
    dala.require('templateManager').registerTemplate('simple_circle', {
        description : "Simple Circle with text.",
        dockingType : "CIRCLE",
        title : "circle",
        color_main : "#FFFFFF",
        docking : {
            type: 'circle',
            orientation: 'center'
        },
        resize : [
            {bind:"#body_back", value:"circle", min:"parent"},
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
            },
            stroke : {
                type: "stroke",
                label: "Stroke",
                bind: "#body_back"
            },
            strokeWidth : {
                type: "stroke-width",
                label: "Stroke-width",
                bind: "#body_back"
            },
            strokeDash : {
                type: "stroke-dash",
                label: "Stroke-dash",
                bind: "#body_back"
            }
        }
    });
})();