const tools  = require( './../../tools/tools').tools;
const config = require( './../../tools/config').config;
const html   = require( './../../tools/html').html;
const ipc    = require('electron').ipcRenderer;
const fs     = require('fs');
const path   = require('path');
const util   = require('util');
const spawn  = require('child_process').spawn;
const _      = require('underscore');

const projectsListDiv   = document.getElementById( 'projectsListDiv');
const simulatorsListDiv = document.getElementById( 'simulatorsListDiv');
const runBtn            = document.getElementById( 'runBtn');
runBtn.addEventListener( 'click', function( event) {
    run();
});

let stateData = {
    simulators : {}
};

(function(){
    refreshProjectList();
    refreshSimulatorsAndDevices();
}());

function refreshProjectList(){
    let workspacePath = config.get( 'workspace');
    tools.assert( tools.file.exists( workspacePath), "Le workspace n'existe pas : " + workspacePath);
    let files = tools.file.readDir( workspacePath);
    let dirs  = files.filter( function( fileName){
        var dirPath = workspacePath + '/' + fileName;
        if ( !tools.file.isDirectory( dirPath) ) return false;
        else return tools.file.isFile( dirPath + '/tiapp.xml');
    });

    tools.assert( dirs && dirs.length, 'Workspace vide : ' + workspacePath);

    projectsListDiv.innerHTML = '';
    _.each( dirs, function( dir, index){
        let id  = '_projectRadio_' + index + '_';
        html.createRadio( projectsListDiv, id, dir, dir, 'projectRadioGroup', index === 0);
    });
}

function refreshSimulatorsAndDevices(){
    function _getIosMinVersion( _json){
        let min = parseFloat( _.min( _json['ios'][0]['min-ios-ver']));
        return !isNaN( min) ? min : config.get( '_default_min_ios_version');
    }

    function _getTargetList( _json){
        let targets = _json['deployment-targets'][0]['target'];
        let obj = {};
        _.each( targets, function( target){
            obj[ target.$.device] = target._ === 'true';
        });
        return obj;
    }

    function _getIosSimulators( _tiInfos, _minIosVersion, _targetList){
        _minIosVersion || ( _minIosVersion = config.get( '_default_min_ios_version'));
        _targetList    || ( targetList = {});
        let simulators = {};
        _.each( _tiInfos.ios.simulators.ios, function( simList, simVersion){
            if ( simVersion < _minIosVersion ) return;
            _.each( simList, function( sim) {
                var family = (sim.family || '').toLowerCase();
                if ( !_targetList[ family] ) return;
                simulators[ sim.udid] = {
                    simulator  : true,
                    type       : sim.type,
                    deviceDir  : sim.deviceDir,
                    deviceName : sim.deviceName,
                    name       : sim.name,
                    udid       : sim.udid,
                    version    : sim.version,
                    family     : family
                };
            });
        });
        stateData.simulators = simulators;
        return simulators;
    }

    function _getIosDevices( _tiInfos, _minIosVersion, _targetList){
        _minIosVersion || ( _minIosVersion = config.get( '_default_min_ios_version'));
        _targetList    || ( targetList = {});
        let devices = {};
        _.each( _tiInfos.ios.devices, function( device){
            var deviceClass = (device.deviceClass || '').toLowerCase();
            if ( !_targetList[ deviceClass] || device.productVersion < _minIosVersion ) return;
            devices[ device.udid] = {
                simulator  : false,
                type       : 'ios',
                deviceDir  : '',
                deviceName : device.name,
                name       : device.name,
                udid       : device.udid,
                version    : device.productVersion,
                family     : deviceClass
            };
        });
        stateData.devices = devices;
        return devices;
    }

    function onGetTiInfos( tiInfos) { console.log( tiInfos)
        function onGetTiappJSON( json) {
            tools.assert( json, 'refreshSimulatorsAndDevices.onGetTiappJSON : No Tiapp Data');
            let iosMinVersion = _getIosMinVersion( json);
            let targetList    = _getTargetList( json);
            let iosSimulators = _getIosSimulators( tiInfos, iosMinVersion, targetList);
            let iosDevices    = _getIosDevices( tiInfos, iosMinVersion, targetList);
            simulatorsListDiv.innerHTML = '';
            _.each( iosSimulators, function( simulator, udid){
                html.createRadio( simulatorsListDiv, udid, udid, simulator.name, 'deviceRadioGroup', false);
            });

            _.each( iosDevices, function( device, udid){
                html.createRadio( simulatorsListDiv, udid, udid, device.name, 'deviceRadioGroup', false); // TODO : Changer la div
            });
        }
        tools.getTiappJSON( html.getSelectedRadio( 'projectRadioGroup'), onGetTiappJSON);
    }
    tools.getTiInfos( onGetTiInfos);
}

config.set( 'build.skip_js_minify', 'false');
console.log( config.get( 'build'))
console.log( config.get( 'build.skip_js_minify'))
console.log( '****************** A')

config.set( 'build.skip_js_minify.newProps', 'false');
console.log( config.get( 'build'))
console.log( config.get( 'build.skip_js_minify.newProps'))
console.log( '****************** B')

config.set( 'test.propsTest', 'false');
console.log( config.get( 'test'))
console.log( config.get( 'test.propsTest'))
console.log( '****************** C')


config.set( 'test.propsTest2.subProps2', 'false');
console.log( config.get( 'test'))
console.log( config.get( 'test.propsTest2.subProps2'))
console.log( '****************** D')




function run(){
    var selectedProject = html.getSelectedRadio( 'projectRadioGroup');
    var selectedDevice  = html.getSelectedRadio( 'deviceRadioGroup');
    let simulator       = stateData.simulators[ selectedDevice];
    let device          = stateData.devices[ selectedDevice];
    tools.assert( simulator || device, "Aucun simulator / device ne correspond à celui sélectionné");
    let projectPath = path.resolve( config.get( 'workspace'), selectedProject);
    let params = [];
    
    if ( device ) {
        params = [ 'build', '-p', device.type,    '-C', '-T', 'device',    device.udid,    '-d', projectPath, '--skip-js-minify', 'true', '--sim-focus', 'true'];
    } else {
        params = [ 'build', '-p', simulator.type, '-C', '-T', 'simulator', simulator.udid, '-d', projectPath, '--skip-js-minify', 'true', '--sim-focus', 'true' ];
    }

    let runCmd = spawn('ti', params);
    runCmd.stdout.on('data', function (data) {
      console.log('stdout: ' + data.toString());
    });

    runCmd.stderr.on('data', function (data) {
      console.log('stderr: ' + data.toString());
    });

    runCmd.on('exit', function (code) {
      console.log('child process exited with code ' + code.toString());
  });
}
