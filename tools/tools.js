const fs          = require('fs');
const spawn       = require('child_process').spawn;
const config      = require('./config').config;
const parseString = require('xml2js').parseString;

exports.tools = {
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
}
