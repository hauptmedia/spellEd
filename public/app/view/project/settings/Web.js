Ext.define('Spelled.view.project.settings.Web' ,{
    extend: 'Spelled.view.project.settings.Form',
    alias: 'widget.projectwebsettings',

    title : 'Web',

    initComponent: function() {

        Ext.applyIf( this, {
                items: [
                    {
                        boxLabel: 'Use CSS (reference) pixels',
                        xtype: 'checkbox',
                        inputValue: true,
                        name: 'cssReferencePixels'
                    },
					{
						boxLabel: 'Generate HTML5 build',
						xtype: 'checkbox',
						inputValue: true,
						checked: true,
						readOnly: true,
						name: 'html5'
					},
					{
						boxLabel: 'Generate Flash build',
						xtype: 'checkbox',
						inputValue: true,
						name: 'flash'
					}
                ]
            }
        )

        this.callParent( arguments )
    }
})