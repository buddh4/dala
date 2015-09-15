(function() {
    dala.require('templateManager').registerTemplate('uml_seq_class', {
        init_width : "150",
        init_title : "New Class",
        color_main : "#FFFFFF",
        dockingType : "FREE",
        resize: [
            {bind:"#head_back", value:"default static"},
            {bind:"#title_t", position: "center static"},
            {bind:"#time_line", value:"vertical", position: "center static", alignto:"parent"},
            {bind:"#time_line_area", value:"vertical", position: "center static", alignto:"parent"}
        ],
        edit: {
            title : {
                type : "text",
                label : "Title",
                bind : "#title_span",
                trigger : "#title_t"
            },
            mainColor : {
                type : "color",
                label : "Main Color",
                bind : "#head_back"
            }
        }
    });
})();