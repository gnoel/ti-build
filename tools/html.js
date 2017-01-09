const config = require('./config').config;
const tools  = require('./tools').tools;

exports.html = {
    empty : function( container){
        this._check( 'empty', container);
        container.innerHTML = '';
    },

    createText : function( container, text, color){
        this._check( 'createText', container);
        let p = document.createElement('p');
        p.innerText   = text  || '';
        p.style.color = color || '';
        container.appendChild( p);
        return p;
    },

    createRadio : function( container, id, value, label, group, checked){
        this._check( 'createRadio', container);

        let div = document.createElement('div');

        let radio     = document.createElement( 'input');
        radio.type    = 'radio';
        radio.id      = id      || '';
        radio.name    = group   || '';
        radio.checked = checked || false;
        radio.value   = value   || '';

        let lbl       = document.createElement( 'label');
        lbl.for       = id    || '';
        lbl.innerText = label || '';

        div.appendChild( radio);
        div.appendChild( lbl);

        container.appendChild( div);
        return div;
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
    },

    _check : function( fctName, container){
        tools.assert( document  && document.createElement, 'html.' + fctName + ' : fonction exécutée dans le mauvais environnement');
        tools.assert( container && container.appendChild,  'html.' + fctName + ' : container manquant ou non HTMLElement');
    }
}
