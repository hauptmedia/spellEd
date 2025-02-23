Ext.define('Spelled.view.asset.Form', {
	extend: 'Ext.form.Panel',
	alias: 'widget.assetform',

	requires: [
		'Ext.form.FieldSet'
	],

	items: [
		{
			xtype: 'fieldset',
			border: false,
			defaults: {
				anchor: '100%',
				allowBlank: false
			},
			bodyPadding: 10,

			items: [
				{
					xtype: "hidden",
					name: 'subtype'
				},
				{
					xtype: "spellednamefield",
					name: 'name',
					fieldLabel: 'Name',
					vtype: 'alphanum'
				},
				{
					xtype: "assetfolderpicker",
					name: 'namespace',
					fieldLabel: 'Namespace',
					displayField: 'text',
					valueField: 'id'
				},
				{
					xtype: 'menuseparator'
				}
			]
		}
	],


	buttons: [
		{
			disabled: Spelled.Configuration.isDemoInstance(),
			formBind: !Spelled.Configuration.isDemoInstance(),
			text: 'Upload',
			action: 'createAsset',
			tooltip: Spelled.Configuration.getDemoTooltipText()
		}
	]

});
