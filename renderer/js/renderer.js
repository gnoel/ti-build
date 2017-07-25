const utils     = require( './../../utils/utils');
const config    = utils.config;
const tools     = utils.tools;
const html      = utils.html;
const ipc       = require('electron').ipcRenderer;
const clipboard = require('electron').clipboard;
const path      = require('path');
const spawn     = require('child_process').spawn;
const spawnSync = require('child_process').spawnSync;
const _         = require('underscore');

const projectsDiv     = document.getElementById( 'projectsDiv');
const devicesDiv      = document.getElementById( 'devicesDiv');
const provisioningDiv = document.getElementById( 'provisioningDiv');
const configBtn       = document.getElementById( 'configBtn');
const runBtn          = document.getElementById( 'runBtn');
const refreshBtn      = document.getElementById( 'refreshBtn');
const stopBtn         = document.getElementById( 'stopBtn');
const openDbBtn       = document.getElementById( 'openDbBtn');
const clearConsoleBtn = document.getElementById( 'clearConsole');
const gitPullBtn      = document.getElementById( 'gitPullBtn');
const consoleDiv      = document.getElementById( 'console');

configBtn.addEventListener( 'click', openConfig);
refreshBtn.addEventListener( 'click', refreshProjectList);
runBtn.addEventListener( 'click', run);
stopBtn.addEventListener( 'click', stopProcess);
openDbBtn.addEventListener( 'click', openDB);
clearConsoleBtn.addEventListener( 'click', clearConsole);
//gitPullBtn.addEventListener( 'click', gitPull);

// TODO : GROS REFACTO de ce truc bien crade
ipc.on('refreshF5', function(){
    if ( config.get( 'run_event_F5_or_F6') == 'F5' ) {
        run();
    }
});
ipc.on('refreshF6', function(){
    if ( config.get( 'run_event_F5_or_F6') == 'F6' ) {
        run();
    }
});

let stateData = {
    simulators : {},
    devices : {}
};

(function(){
    refreshProjectList();
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

    html.empty( projectsDiv);
    let select = html.createSelect( projectsDiv, 'projectList', 'Projet' , refreshSimulatorsAndDevices);
    if ( !dirs || !dirs.length ) {
        html.addOptionToSelect( select, null, '*** Aucun projet ***', true);
    } else {
        _.each( dirs, function( dir, index){
            var dirPath    = workspacePath + '/' + dir
            let gitBranch  = spawnSync('git', [ '-C', dirPath, 'rev-parse', '--abbrev-ref', 'HEAD']);
            let branchName = (gitBranch && gitBranch.stdout ? gitBranch.stdout.toString() : '').trim();
            let label      = branchName ? ( dir + ' [' + branchName + ']') : dir;
            let id         = '_projectRadio_' + index + '_';
            html.addOptionToSelect( select, dir, label, index === 0);
        });
    }
    refreshSimulatorsAndDevices();
}

function refreshSimulatorsAndDevices(){
    function _getIosMinVersion( _json){
        let min = parseFloat( _json['ios'][0]['min-ios-ver']);
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
        _targetList.ipod = _targetList.iphone; // Pour trouver les iPod si le projet est de type iPhone
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

    function _addDevicesInList( select, title, list, autoSelect){
        if ( !list || !_.size( list) ) return;
        tools.assert( select, '_addDevicesInList : Container manquant');
        html.addOptionToSelect( select, null, '*** ' + title + ' ***', false);
        let first = true;
        _.each( list, function( device, udid){
            html.addOptionToSelect( select, udid, device.name, ( autoSelect && first));
            first = false;
        });
    }

    function _addProvisioning( _tiInfos){
        function _saveProvisioning(){
            config.set( 'provisioning_profile', html.getSelectedSelect( 'provisioningList'));
        }
        if ( !_tiInfos || !_tiInfos.ios || !_tiInfos.ios.provisioning ) return;
        let defaultProvisioning = config.get( 'provisioning_profile');
        function _add( _select, proviList, title){
            if ( !_select || !proviList || !proviList.length ) return;
            _.each( proviList, function( provisioning){
                if ( provisioning.expired ) return;
                let uuid            = provisioning.uuid;
                let expireDate      = new Date( provisioning.expirationDate);
                let expireDateLabel = expireDate.getDate() + '/' + (expireDate.getMonth()+1) + '/' + expireDate.getFullYear();
                let label           = title + ' : ' + provisioning.name + ' [Expire : ' + expireDateLabel + ']';
                html.addOptionToSelect( _select, uuid, label, uuid === defaultProvisioning);
            });
        }
        html.empty( provisioningDiv);
        let select = html.createSelect( provisioningDiv, 'provisioningList', 'Provisioning Profile', _saveProvisioning);
        _add( select, _tiInfos.ios.provisioning.adhoc,        'Adhoc');
        _add( select, _tiInfos.ios.provisioning.development,  'Developpement');
        _add( select, _tiInfos.ios.provisioning.distribution, 'Distribution');
    }

    function _addCertificates( _tiInfos){
        function _saveCertificate(){
            config.set( 'certificate', html.getSelectedSelect( 'certificateList'));
        }
        if ( !_tiInfos || !_tiInfos.ios || !_tiInfos.ios.certs || !_tiInfos.ios.certs.keychains ) return;
        let defaultCertificate = config.get( 'certificate');
        html.empty( certificateDiv);
        let select = html.createSelect( certificateDiv, 'certificateList', 'Certificats', _saveCertificate);
        _.each( _tiInfos.ios.certs.keychains, function( keychain){
            _.each( keychain, function( certificates, type){
                _.each( certificates, function( certif){
                    if ( certif.expired ) return;
                    let name  = certif.name;
                    let label = type + ' : ' + name;
                    html.addOptionToSelect( select, name, label, name === defaultCertificate);
                })
            });
        })
    }

    function onGetTiInfos( tiInfos) {
        function onGetTiappJSON( json) {
            tools.assert( json, 'refreshSimulatorsAndDevices.onGetTiappJSON : No Tiapp Data');
            let iosMinVersion = _getIosMinVersion( json);
            let targetList    = _getTargetList( json);
            let iosSimulators = _getIosSimulators( tiInfos, iosMinVersion, targetList);
            let iosDevices    = _getIosDevices( tiInfos, iosMinVersion, targetList);
            html.empty( devicesDiv)
            let deviceSelect  = html.createSelect( devicesDiv, 'deviceList', 'Devices');
            _addDevicesInList( deviceSelect, 'Devices',     iosDevices, false);
            _addDevicesInList( deviceSelect, 'Simulateurs', iosSimulators, true);
        }
        tools.getTiappJSON( html.getSelectedSelect( 'projectList'), onGetTiappJSON);
        _addProvisioning( tiInfos);
        _addCertificates( tiInfos);
    }

    function loadingMessage( container){
        if ( !container ) return;
        html.empty( container)
        html.createText( container, 'Chargement en cours...');
    }
    loadingMessage( devicesDiv);
    loadingMessage( provisioningDiv);
    loadingMessage( certificateDiv);
    tools.getTiInfos( onGetTiInfos);
}

let runCmd = null;
function run(){
    stopProcess();

    var selectedProject = html.getSelectedSelect( 'projectList');
    var selectedDevice  = html.getSelectedSelect( 'deviceList');
    let simulator       = stateData.simulators[ selectedDevice];
    let device          = stateData.devices[ selectedDevice];

    tools.assert( simulator || device, "Aucun simulateur / device ne correspond à celui sélectionné");
    let projectPath = path.resolve( config.get( 'workspace'), selectedProject);

    let provisionningProfile = html.getSelectedSelect( 'provisioningList') || config.get( 'provisioning_profile');
    let certificate          = html.getSelectedSelect( 'certificateList')  || config.get( 'certificate');

    let cmd    = 'ti';
    let params = [];
    params.push( 'build');
    params.push( '-D');
    params.push( 'development');
    params.push( '-d');
    params.push( projectPath);
    params.push( '--log-level');
    params.push( config.get( 'log_level'));

    if ( device ) {
        params.push( '-p');
        params.push( device.type);
        params.push( '-C');
        params.push( device.udid);
        params.push( '-T');
        params.push( 'device');
        params.push( '--skip-js-minify');
        params.push( config.get( 'skip_js_minify'));
        params.push( '-V');
        params.push( certificate);
        params.push( '-P');
        params.push( provisionningProfile);
    } else {
        params.push( '-p');
        params.push( simulator.type);
        params.push( '-C');
        params.push( simulator.udid);
        params.push( '-T');
        params.push( 'simulator');
        params.push( '--sim-focus');
        params.push( config.get( 'sim_focus'));
    }

    html.empty( consoleDiv);

    runCmd = spawn( cmd, params);
    runCmd.stdout.on('data', function (data) {
        log( data.toString());
    });

    runCmd.stderr.on('data', function (data) {
        log( data.toString());
    });

    runCmd.on('exit', function (code) {
        if ( !code ) log( '**** Compilation stopped ****');
    });

    log( '* RUN *');
}

let colors = {
    '[DEBUG]' : config.get( 'console_debug'),
    '[TRACE]' : config.get( 'console_trace'),
    '[INFO]'  : config.get( 'console_info'),
    '[ERROR]' : config.get( 'console_error'),
    '[WARN]'  : config.get( 'console_warn'),
    'normal'  : config.get( 'console_normal')
};

function log( text){
    function _getColor( _text){
        if ( !colors ) return;
        _text || ( _text = '');
        let match = _text.match( /^\[\w+\]/);
        if( !match ) return colors.normal;
        else {
            return colors[ match[0] || ''] || colors.normal;
        }
    }
    text || ( text = '');
    text = text.trim();
    let line  = html.createText( consoleDiv, text, _getColor( text));
    console.log( text[text.length-1] == '\n')
    if ( line ) line.scrollIntoView();
}

function stopProcess(){
    if ( runCmd ) runCmd.kill();
}

function openDB() {
    var selectedDevice = html.getSelectedSelect( 'deviceList');
    let simulator      = stateData.simulators[ selectedDevice];
    tools.assert( simulator, 'Action disponible que pour un simulateur');
    let pathA      = '/Users/' + config.get( 'username') + '/Library/Developer/CoreSimulator/Devices/' + simulator.udid + '/data/Containers/Data/Application/';
    let dirContent = tools.file.readDir( pathA);

    let dirs       = dirContent.filter( function( name){
        return tools.file.isDirectory( pathA + name);
    });

    dirs.sort( function( a, b){
        let dirA = tools.file.getInfos( pathA + a);
        let dirB = tools.file.getInfos( pathA + b);
        return dirA.birthtime > dirB.birthtime ? -1 : 1;
    });

    let appDir = dirs[0];
    tools.assert( appDir, 'Aucune application installée sur ce simulateur');
    let goodPath = pathA + appDir + '/Library/Private Documents/';
    clipboard.writeText( goodPath + 'addition.sql');
    let path = [ goodPath];
    let cmd = spawn( 'open', path);
}

function clearConsole() {
    html.empty( consoleDiv);
}

/*function gitPull(){
    html.empty( consoleDiv);
    var selectedProject = html.getSelectedSelect( 'projectList');
    let projectPath = path.resolve( config.get( 'workspace'), selectedProject);
    projectPath += '/';
    alert( projectPath)
    let cmd  = spawn('git', [ 'pull', projectPath]);
    cmd.stdout.on('data', function (data) {
        log( data.toString());
    });

    cmd.stderr.on('data', function (data) {
        log( data.toString());
    });

    cmd.on('exit', function (code) {
        if ( !code ) log( '**** FIN DU GIT PULL ****');
    });
    cmd.kill();
}*/
