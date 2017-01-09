const tools  = require( './../../tools/tools').tools;
const config = require( './../../tools/config').config;
const html   = require( './../../tools/html').html;
const fs     = require('fs');
const path   = require('path');

(function(){
    openConfigFile();
}());

function openConfigFile(){
    var userDir = app.getPath( 'userData');
    alert( userDir)
}
