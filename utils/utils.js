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
        },
        getInfos : function( path){
            return fs.lstatSync( path);
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

    getTiappPath : function( projectDir){
        var workspacePath = config.get( 'workspace');
        if ( !workspacePath || !projectDir ) this.throwError( 'tools.getTiappPath : Chemin du projet incomplet');
        var tiappPath = workspacePath + '/' + projectDir + '/tiapp.xml'
        if ( !this.file.isFile( tiappPath) ) this.throwError( 'tools.getTiappPath : Pas de fichier tiapp.xml dans ce projet');
        return tiappPath;
    },

    getTiappXML : function( projectDir){
        return this.file.readFile( this.getTiappPath( projectDir));
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
    logLevel : [
        "Trace",
        "Debug",
        "Info",
        "Warning",
        "Error",
    ],
    getConfigPath : function(){
        return CONFIG_PATH;
    },
    set : function( name, value){
        if ( !name ) return;
        let conf = this.readConfigFile();
        conf[ name] = value;
        this.writeConfigFile( conf);
    },
    get : function( name){
        if ( !name ) return '';
        let conf = this.readConfigFile();
        return conf[ name] || '';
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
        let p = document.createElement('pre');
        p.innerText   = text  || '';
        p.style.color = color || '';
        container.appendChild( p);
        return p;
    },

    createTextInput : function( container, id, label, value, onKeyup){
        this._check( 'createTextInput', container);

        let div = document.createElement('div');

        let lbl       = document.createElement( 'label');
        lbl.for       = id    || '';
        lbl.innerText = (label || '') + ' : ';

        let input     = document.createElement( 'input');
        input.type    = id !== 'password' ? 'text' : 'password';
        input.id      = id      || '';
        input.value   = value   || '';
        if ( onKeyup ) input.addEventListener( 'keyup', onKeyup);

        div.appendChild( lbl);
        div.appendChild( input);

        container.appendChild( div);
        return div;
    },

    createColorInput : function( container, id, label, value, onChange){
        this._check( 'createColorInput', container);

        let div = document.createElement('div');

        let lbl       = document.createElement( 'label');
        lbl.for       = id    || '';
        lbl.innerText = (label || '') + ' : ';

        let input     = document.createElement( 'input');
        input.type    = 'color';
        input.id      = id      || '';
        input.value   = value   || '';
        if ( onChange ) input.addEventListener( 'change', onChange);

        div.appendChild( lbl);
        div.appendChild( input);

        container.appendChild( div);
        return div;
    },

    createSelect : function( container, id, label, onChange){
        this._check( 'createSelect', container);
        let div = document.createElement('div');

        let lbl       = document.createElement( 'label');
        lbl.for       = id     || '';
        lbl.innerText = (label || '') + ' : ';

        let select = document.createElement('select');
        select.id  = id || '';
        if ( onChange ) select.addEventListener( 'change', onChange);

        div.appendChild( lbl);
        div.appendChild( select);

        container.appendChild( div);

        return select;
    },

    addOptionToSelect : function( select, value, label, selected){
        this._check( 'addOptionToSelect', select);

        let option = document.createElement( 'option');
        option.label = label || '';
        if ( value    ) option.value    = value;
        if ( selected ) option.selected = true;

        select.appendChild( option);

        return option;
    },

    getSelectedSelect : function( selectId){
        tools.assert( document  && document.getElementsByName, 'html.getSelectedSelect : fonction exécutée dans le mauvais environnement');
        tools.assert( selectId, 'html.getSelectedSelect : Select non existant');
        const select = document.getElementById( selectId);
        tools.assert( select, "Aucune élement Select trouvé : " + selectId);
        let options = select.options;
        if ( !options || !options.length ) return;
        let selectedOpt = options[ select.selectedIndex] || null;
        return selectedOpt ? selectedOpt.value : null;
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
