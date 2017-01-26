const fs          = require('fs');
const spawn       = require('child_process').spawn;
const parseString = require('xml2js').parseString;
const remote      = require('electron').remote;
const app         = remote.app;
const CONFIG_PATH = (function(){
    let userDir = app.getPath( 'userData');
    return userDir + '/config.txt';
}());

var tools = {
    assert : function( assersion, errorMsg){
        if ( !assersion ) this.throwError( errorMsg);
    },
    throwError : function( message){
        message || ( message = "Une erreur s'est produite");
        alert( message);
        throw message
    },
    file : {
        isDirectory : function( path){
            return this.exists( path) && fs.lstatSync( path).isDirectory()
        },
        isFile : function( path){
            return this.exists( path) && fs.lstatSync( path).isFile()
        },
        exists : function( path){
            return fs.existsSync( path);
        },
        readFile : function( path){
            return fs.readFileSync( path, { encoding : 'utf8'});
        },
        readDir : function( path){
            return fs.readdirSync( path);
        },
        writeFile : function( path, content){
            fs.writeFileSync( path, content);
        }
    },
    getTiInfos : function( callback){
        if ( !callback ) return;
        let runCmd = spawn('ti', [ 'info', '-o', 'json']);
        var allData = '';
        runCmd.stdout.on('data', function (data) {
            allData += data.toString();
        });
        runCmd.on('exit', function( errorCode) {
            this.assert( !errorCode, 'tools.getTiInfos : Fail');
            var json = JSON.parse( allData);
            callback( json);
        }.bind( this));
    },

    getTiappXML : function( projectDir){
        var workspacePath = config.get( 'workspace');
        if ( !workspacePath || !projectDir ) this.throwError( 'tools.getTiapp : Chemin du projet incomplet');
        var tiappPath = workspacePath + '/' + projectDir + '/tiapp.xml'
        if ( !this.file.isFile( tiappPath) ) this.throwError( 'tools.getTiapp : Pas de fichier tiapp.xml dans ce projet');
        return this.file.readFile( tiappPath);
    },

    getTiappJSON : function( projectDir, callback){
        if ( !callback ) return;
        var xml = this.getTiappXML( projectDir);
        parseString( xml, function( err, result) {
            if ( err ) this.throwError( 'tools.getTiappJSON : ' + err);
            callback( result['ti:app'] || null );
        }.bind( this));
    }
};

var config = {
    _conf : null, // Cache
    getConfigPath : function(){
        return CONFIG_PATH;
    },
    set : function( name, value){
        if ( !name ) return;
        let node  = this._conf;
        let props = name.split( '.');
        props.forEach( function( prop, index){
            let isLast = index === props.length;
            if ( isLast ) node[ prop] = value;
            else node = node[ prop] || {};
        });
    },
    get : function( name){
        if ( !this._conf ) this._conf = this.readConfigFile();
        if ( !name === null ) return '';
        let value = this._conf;
        let props = name.split( '.');
        props.forEach( function( prop){
            value = value[ prop] || {};
        });
        return value || '';
    },
    readConfigFile : function(){
        this._buildConfigFile();
        return this._readConfigFile();
    },
    _readConfigFile : function(){
        if ( tools.file.isFile( CONFIG_PATH) ) return JSON.parse( tools.file.readFile( CONFIG_PATH) || '{}');
        else return {};
    },
    _readDefaultConfigFile : function(){
        return require( './defaultConfig') || {};
    },
    writeConfigFile : function( data){
        data || ( data = {});
        tools.file.writeFile( CONFIG_PATH, JSON.stringify( data, null, 4));
        this._conf = null;
    },
    _buildConfigFile : function(){
        let configFile    = this._readConfigFile();
        let defaultConfig = this._readDefaultConfigFile();
        for ( props in defaultConfig ){
            if ( !configFile.hasOwnProperty( props) ) configFile[ props] = defaultConfig[ props];
        }
        this.writeConfigFile( configFile);
    }
};

var html = {
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

    createRadio : function( container, id, value, label, group, checked, onChange){
        this._check( 'createRadio', container);

        let div = document.createElement('div');

        let radio     = document.createElement( 'input');
        radio.type    = 'radio';
        radio.id      = id      || '';
        radio.name    = group   || '';
        radio.checked = checked || false;
        radio.value   = value   || '';
        if ( onChange ) radio.addEventListener( 'change', onChange);

        let lbl       = document.createElement( 'label');
        lbl.for       = id    || '';
        lbl.innerText = label || '';

        div.appendChild( radio);
        div.appendChild( lbl);

        container.appendChild( div);
        return div;
    },

    createTextInput : function( container, id, label, value, onKeyup){
        this._check( 'createTextInput', container);

        let div = document.createElement('div');

        let lbl       = document.createElement( 'label');
        lbl.for       = id    || '';
        lbl.innerText = (label || '') + ' : ';

        let input     = document.createElement( 'input');
        input.type    = 'text';
        input.id      = id      || '';
        input.value   = value   || '';
        if ( onKeyup ) input.addEventListener( 'keyup', onKeyup);

        div.appendChild( lbl);
        div.appendChild( input);

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
};

module.exports = {
    tools  : tools,
    config : config,
    html   : html
};
