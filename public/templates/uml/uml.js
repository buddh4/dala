(function() {
    dala.require('templateManager').registerPanel({
        id: 'uml',
        label: 'UML',
        templates : {
            uml_class: {id:'uml_class', label:'Class'},
            uml_component: {id:'uml_component', label:'Component'},
            uml_package: {id:'uml_package', label:'Package'},
            uml_seq_class: {id:'uml_seq_class', label:'Sequence'},
            uml_stereotype: {id:'uml_stereotype', label:'Stereotyped'}
        }
    });
})();