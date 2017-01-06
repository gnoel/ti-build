exports.config = {
    _conf : {
        workspace : '/Users/geoffreynoel/Documents/Appcelerator_Studio_Workspace',
        _default_min_ios_version : 7, // Ne pas changer
        build : {
            skip_js_minify : 'true',
            min_log_level  : 'trace', // trace, debug, info, warn, error
            sim_focus      : 'true',

        }
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
        if ( !name === null ) return '';
        let value = this._conf;
        let props = name.split( '.');
        props.forEach( function( prop){
            value = value[ prop] || {};
        });
        return value || '';
    }
}
