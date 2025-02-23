Ext.define('Spelled.view.template.component.Property', {
    extend: 'Ext.form.Panel',
    alias : 'widget.componenttemplateproperty',

	overflowY: 'auto',
    bodyPadding: 10,
    margin: '5 0 0 0',
    title: 'Attribute',
	frame: true,
	layout: 'form',

	defaults: {
		hidden: true
	},

    items: [
        {
            xtype: 'textfield',
            name: 'name',
            fieldLabel: 'Name',
            allowBlank:false
        },
		{
			xtype: 'spelledbooleanfield',
			name: 'engineInternal',
			fieldLabel: 'Engine internal'
		},
        {
            xtype: 'combobox',
			editable: false,
			queryMode: 'local',
			displayField: 'name',
			valueField: 'name',
            name: 'type',
            fieldLabel: 'Type',
            allowBlank: false,
			store: 'template.component.AttributeTypes'
        }
	],

	showConfig: function() {
		this.items.each(
			function( item ) {
				item.show()
			}
		)
	}
});
