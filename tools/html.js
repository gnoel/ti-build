const config = require('./config').config;
const tools  = require('./tools').tools;

exports.html = {
    createRadio : function( container, id, value, label, group, checked){
        tools.assert( document  && document.createElement, 'html.createRadio : fonction exécutée dans le mauvais environnement');
        tools.assert( container && container.appendChild,  'html.createRadio : container manquant ou non HTMLElement');

        let div = document.createElement('div');

        let radio     = document.createElement( 'input');
        radio.type    = 'radio';
        radio.id      = id      || '';
        radio.name    = group   || '';
        radio.checked = checked || false;
        radio.value   = value   || '';

        let lbl       = document.createElement( 'label');
        lbl.for       = id    || '';
        lbl.innerHTML = label || '';

        div.appendChild( radio);
        div.appendChild( lbl);

        container.appendChild( div);
    },

    getSelectedRadio : function( group){
        tools.assert( document  && document.getElementsByName, 'html.getSelectedRadio : fonction exécutée dans le mauvais environnement');
        group || ( group = '');
        const radios = document.getElementsByName( group);
        tools.assert( radios && radios.length, "Aucune élement Radio trouvé : " + group);
        let selectedRadio = null;
        for ( let i = 0; i < radios.length; i++ ) {
            const radio = radios[ i];
            if ( radio.checked ) selectedRadio = radio;
        }
        tools.assert( selectedRadio, "Aucun élement Radio sélectionné " + group);
        return selectedRadio.value;
    }
}
