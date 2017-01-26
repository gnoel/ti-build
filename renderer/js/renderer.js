const utils  = require( './../../utils/utils');
const config = utils.config;
const tools  = utils.tools;
const html   = utils.html;
const ipc    = require('electron').ipcRenderer;
const path   = require('path');
const spawn  = require('child_process').spawn;
const _      = require('underscore');

const projectsListDiv   = document.getElementById( 'projectsListDiv');
const simulatorsListDiv = document.getElementById( 'simulatorsListDiv');
const devicesListDiv    = document.getElementById( 'devicesListDiv');
const runBtn            = document.getElementById( 'runBtn');
const consoleDiv        = document.getElementById( 'console');
runBtn.addEventListener( 'click', function( event) {
    run();
});

let stateData = {
    simulators : {},
    devices : {}
};

(function(){
    refreshProjectList();
    refreshSimulatorsAndDevices();
    openConfig();
}());

function openConfig(){
    ipc.send('ipc-openConfig')
}

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

    html.empty( projectsListDiv);
    _.each( dirs, function( dir, index){
        let id  = '_projectRadio_' + index + '_';
        html.createRadio( projectsListDiv, id, dir, dir, 'projectRadioGroup', index === 0);
    });
}

function refreshSimulatorsAndDevices(){
    function _getIosMinVersion( _json){
        let min = parseFloat( _.min( _json['ios'][0]['min-ios-ver']));
        return !isNaN( min) ? min : config.get( 'default_min_ios_version');
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
        _minIosVersion || ( _minIosVersion = config.get( 'default_min_ios_version'));
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
        _minIosVersion || ( _minIosVersion = config.get( 'default_min_ios_version'));
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

    function _addDevicesRadios( container, list){
        tools.assert( container, '_addDevicesRadios : Container manquant');
        if ( !list || !_.size( list) ) html.createText( container, 'Aucun');
        else {
            html.empty( container);
            _.each( list, function( device, udid){
                html.createRadio( container, udid, udid, device.name, 'deviceRadioGroup', false);
            });
        }
    }

    function onGetTiInfos( tiInfos) {
        function onGetTiappJSON( json) {
            tools.assert( json, 'refreshSimulatorsAndDevices.onGetTiappJSON : No Tiapp Data');
            let iosMinVersion = _getIosMinVersion( json);
            let targetList    = _getTargetList( json);
            let iosSimulators = _getIosSimulators( tiInfos, iosMinVersion, targetList);
            let iosDevices    = _getIosDevices( tiInfos, iosMinVersion, targetList);
            _addDevicesRadios( simulatorsListDiv, iosSimulators);
            _addDevicesRadios( devicesListDiv, iosDevices);
        }
        tools.getTiappJSON( html.getSelectedRadio( 'projectRadioGroup'), onGetTiappJSON);
    }
    tools.getTiInfos( onGetTiInfos);
}

/*config.set( 'build.skip_js_minify', 'false');
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
console.log( '****************** D')*/


//usr/local/bin/node /Users/geoffreynoel/.appcelerator/install/6.1.0/package/node_modules/titanium/lib/titanium.js build run --platform ios --log-level trace --sdk 5.5.1.GA --project-dir /Users/geoffreynoel/Documents/Appcelerator_Studio_Workspace/Laddition --target device --ios-version 10.1 --device-family ipad --developer-name Geoffrey Noel (384MHH926N) --device-id 77d01dec87f3cf013b769c37d69af16992980d8e --pp-uuid 09c91634-7b77-43db-94aa-0cb896b69d54 --no-colors --no-progress-bars --no-prompt --prompt-type socket-bundle --prompt-port 56571 --config-file /var/folders/3s/xlckpgq12bv_w9nx3893rz4c0000gp/T/build-1483889365300.json --no-banner --project-dir /Users/geoffreynoel/Documents/Appcelerator_Studio_Workspace/Laddition

function run(){
    var selectedProject = html.getSelectedRadio( 'projectRadioGroup');
    var selectedDevice  = html.getSelectedRadio( 'deviceRadioGroup');
    let simulator       = stateData.simulators[ selectedDevice];
    let device          = stateData.devices[ selectedDevice];
    tools.assert( simulator || device, "Aucun simulateur / device ne correspond à celui sélectionné");
    let projectPath = path.resolve( config.get( 'workspace'), selectedProject);
    let params = [];

    if ( device ) {
        params = [ 'build', '-p', device.type,    '-C', '-T', 'device',    device.udid,    '-d', projectPath, '-V', 'Geoffrey Noel (384MHH926N)', '-P', '09c91634-7b77-43db-94aa-0cb896b69d54', '--skip-js-minify', 'true'];
    } else {
        params = [ 'build', '-p', simulator.type, '-C', '-T', 'simulator', simulator.udid, '-d', projectPath, '--skip-js-minify', 'true', '--sim-focus', 'true' ];
    }
    html.empty( consoleDiv);
    let runCmd = spawn('ti', params);
    runCmd.stdout.on('data', function (data) {
      log( data.toString());
    });

    runCmd.stderr.on('data', function (data) {
      log( data.toString());
    });

    runCmd.on('exit', function (code) {
      log('child process exited with code ' + code.toString());
  });

  function log( text){
      function _getColor( _text){
          var _keyWords = { //TODO : config
              '[DEBUG]' : 'green',
              '[TRACE]' : 'blue',
              '[INFO]'  : 'white',
              '[ERROR]' : 'red',
              '[WARN]'  : 'orange',
              '[INFO]'  : 'white'
          };
          _text || ( _text = '');
          let match = _text.match( /^\[\w+\]/);
          if( !match ) return 'white';
          else {
              return _keyWords[ match[0] || ''] || 'white';
          }
      }
      text || ( text = '');
      let line  = html.createText( consoleDiv, text, _getColor( text));
      if ( line ) line.scrollIntoView();
  }
}
