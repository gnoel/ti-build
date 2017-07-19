const utils  = require( './../../utils/utils');
const config = utils.config;
const tools  = utils.tools;
const html   = utils.html;
const _      = require('underscore');

const configDiv = document.getElementById( 'configDiv');

(function(){
    function save(){
        if ( !ids || !ids.length ) return;
        var data = {};
        _.each( ids, function( id){
            let elt = document.getElementById( id);
            if ( !elt ) return;
            data[ id] = elt.value;
        });
        config.writeConfigFile( data);
    }
    var conf = config.readConfigFile();
    let ids = _.keys( conf);
    _.each( conf, function( value, id){
        ids.push( id);
        if( id.indexOf('console_') !== -1 ){
            html.createColorInput( configDiv, id, id, value, save);
         }else if( id == "log_level"){
            var select  = html.createSelect( configDiv, id, id, save);
            for (var i = config.logLevel.length - 1; i >= 0; i--) {
                var opt = config.logLevel[i];
                html.addOptionToSelect(select, opt.value, opt.name, opt.value == value ? true : false);
            };
         }else if( id == "run_event_F5_or_F6"){
            var select  = html.createSelect( configDiv, id, id, save);
            for (var i = config.f5f6.length - 1; i >= 0; i--) {
                var opt = config.f5f6[i];
                html.addOptionToSelect(select, opt, opt, opt == value ? true : false);
            };
         }else if(id == "skip_js_minify" || id == "sim_focus"){
             var select  = html.createSelect( configDiv, id, id, save);
            for (var i = config.bools.length - 1; i >= 0; i--) {
                var opt = config.bools[i];
                html.addOptionToSelect(select, opt, opt, opt == value ? true : false);
            };
         }else{
            html.createTextInput( configDiv, id, id, value, save);
         }
    });
}());
