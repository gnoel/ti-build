const fs    = require('fs');
exports.tools = {
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
        }
    }
}
