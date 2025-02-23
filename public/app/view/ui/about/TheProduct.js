Ext.define('Spelled.view.ui.about.TheProduct' ,{
    extend: 'Ext.form.Panel',
    alias: 'widget.spelledabouttheproduct',

    title : 'The Product',

    initComponent: function() {

        Ext.applyIf( this, {
            bodyPadding: '5 5 0',
            html:
                '<img src="resources/images/logo-spell-js.png"/><br/>' +
                    '<strong>SpellJS Version ' + Spelled.Configuration.version + '</strong> ' +
                    '&nbsp;&nbsp;&nbsp;SpellEd Build ' + Spelled.Configuration.buildNumber + '<br/>' +
                    'Built on ' + Spelled.Configuration.buildTimeStamp + '<br/><br/>' +
                    '<br/>' +
                    '&copy; 2011-2013 Spielmeister GmbH, Germany<br/><br/>' +
                    'Parts of this product use open source software.<br/>Please consult the product licence for more details.'

        })

        this.callParent( arguments )
    }
})