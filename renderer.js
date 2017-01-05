// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const tools = require( './tools/tools').tools;
const ipc   = require('electron').ipcRenderer;
const fs    = require('fs');
const path  = require('path');
const util  = require('util');
const spawn = require('child_process').spawn;

const worspacePathField = document.getElementById( 'worspacePathField');
const projectsListDiv   = document.getElementById( 'projectsListDiv');
const simulatorsListDiv = document.getElementById( 'simulatorsListDiv');
const runBtn            = document.getElementById( 'runBtn');

worspacePathField.addEventListener( 'click', function( event) {
    ipc.send('select-workspace-open', worspacePathField.value);
});

ipc.on('workspace-selected', function( event, workspacePath) {
    worspacePathField.value = workspacePath;
    let files = fs.readdirSync( workspacePath);
    let dirs  = files.filter( function( fileName){
        if ( !tools.file.isDirectory( workspacePath + '/' + fileName) ) return false;
        else return tools.file.isFile( workspacePath + '/' + fileName + '/tiapp.xml');
    });

    if ( !dirs || !dirs.length ) projectsListDiv.innerHTML = 'Aucun projet Appcelerator dans ce workspace';
    else {
        projectsListDiv.innerHTML = '';
        dirs.forEach( function( dir, index){
            let id  = '_projectRadio_' + index + '_';
            let div = document.createElement('div');

            let radio     = document.createElement( 'input');
            radio.id      = id;
            radio.type    = 'radio';
            radio.name    = 'projectListRadioGroup';
            radio.checked = index === 0;
            radio.value   = dir;

            let label       = document.createElement( 'label');
            label.for       = id;
            label.innerHTML = dir;

            div.appendChild( radio);
            div.appendChild( label);

            projectsListDiv.appendChild( div);
        });
    }
});

runBtn.addEventListener( 'click', function( event) {
    if ( !worspacePathField.value ) tools.throwError( "Chemin du workspace vide");
    const radios = document.getElementsByName('projectListRadioGroup');
    if ( !radios || !radios.length ) tools.throwError( "Aucune projet dans le worspace");
    let selectedRadio = null;
    for ( let i = 0; i < radios.length; i++ ) {
        const radio = radios[ i];
        if ( radio.checked ) selectedRadio = radio;
    }
    if ( !selectedRadio ) tools.throwError( "Aucun projet sélectionné");
    let projectPath = path.resolve( worspacePathField.value, selectedRadio.value);

console.log( getTiapp('Laddition'))

    /*let runCmd = spawn('ti', ['build', '-p', 'ios'], { cwd : projectPath});

    runCmd.stdout.on('data', function (data) {
      console.log('stdout: ' + data.toString());
    });

    runCmd.stderr.on('data', function (data) {
      console.log('stderr: ' + data.toString());
    });

    runCmd.on('exit', function (code) {
      console.log('child process exited with code ' + code.toString());
  });*/
});

function getAllTiInfos( callback){
    if ( !callback ) return;
    let runCmd = spawn('ti', [ 'info', '-o', 'json']);
    var allData = '';
    runCmd.stdout.on('data', function (data) {
        allData += data.toString();
    });
    runCmd.on('exit', function (code) {
        if ( code ) tools.throwError( 'getAllTiInfos : Fail');
        var json = JSON.parse( allData);
        callback( json);
    });
}

function getTiapp( projectDir){
    if ( !worspacePathField.value || !projectDir ) tools.throwError( 'getTiapp : Chemin du projet incomplet');
    let projectPath = path.resolve( worspacePathField.value, projectDir);
    var tiappPath   = worspacePathField.value + '/' + projectDir + '/tiapp.xml'
    if ( !fs.existsSync( tiappPath) || !fs.lstatSync( tiappPath).isFile() ) tools.throwError( 'getTiapp : Pas de fichier tiapp.xml dans ce projet');
    console.log( tools.file.readFile( tiappPath));


    return fs.lstatSync( tiappPath).isFile();
    fs.existsSync( workspacePath + '/' + fileName + '/tiapp.xml');
    if ( !fs.lstatSync( worspacePathField.value + '/' + projectDir + '/tiapp.xml').isFile() ) return null;
    else return true;

    let subFiles = fs.readdirSync( projectPath);
    var files = subFiles.filter( function( subFileName){
        return subFileName === 'tiapp.xml';
    });
    if ( !files || !files.length ) tools.throwError( 'getTiapp : Pas de fichier tiapp.xml dans ce projet');

}

function refreshInfos(){
    function doRefresh( data){
        console.log( data);
        let ios = data.ios;
        if ( ios ) {
            let simulators = ios.simulators;
            if ( simulators ) {

            }
        }

    }
    getAllTiInfos( doRefresh);
}

refreshInfos();
