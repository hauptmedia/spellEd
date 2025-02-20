Ext.define('Spelled.view.project.settings.iOS' ,{
    extend: 'Spelled.view.project.settings.TabPanel',
    alias: 'widget.projectiossettings',

    title : 'iOS',

    initComponent: function() {

        Ext.applyIf( this, {
	        items:[{
		        title: 'General',
		        xtype: 'projectsettingsform',

		        items: [
	                {
		                xtype:'fieldset',
		                title: 'App settings',
		                defaults: {
			                labelWidth: 130
		                },
		                items: [
			                {
				                xtype: 'textfield',
				                name: 'bundleId',
				                fieldLabel: 'Bundle ID',
				                anchor: '100%'
			                },
			                {
				                // Apple ID (a number) for your app from iTunes Connect.
				                xtype: 'numberfield',
				                name: 'appleId',
				                fieldLabel: 'Apple ID',
				                anchor: '100%'
			                }
		                ]
	                },
	                {
		                xtype:'fieldset',
		                title: 'General Build Options',
		                defaults: {
			                labelWidth: 130
		                },
		                items: [
			                {
				                boxLabel: 'Open Xcode project to manually debug/build the project',
				                xtype: 'checkbox',
				                inputValue: true,
				                name: 'openXcode'
			                }
		                ]
	                }
                ]
	        }, {
				title: 'Signing',
		        xtype: 'projectsettingsform',

		        items: [ {
	                xtype:'fieldset',
	                title: 'Signing options (for release build)',
	                defaults: {
		                labelWidth: 130
	                },
	                items: [
		                {
			                fieldLabel: 'Provisioning Profile',
			                xtype: 'textfield',
			                name: 'releaseProvisioningProfile',
			                anchor: '100%'
		                },
		                {
			                fieldLabel: 'Private key file (.p12)',
			                xtype: 'textfield',
			                name: 'releasePrivateKeyFile',
			                anchor: '100%'
		                }
	                ]
                },
                {
	                xtype:'fieldset',
	                title: 'Signing options (for debug build)',
	                defaults: {
		                labelWidth: 130
	                },
	                items: [
		                {
			                fieldLabel: 'Provisioning Profile',
			                xtype: 'textfield',
			                name: 'debugProvisioningProfile',
			                anchor: '100%'
		                },
		                {
			                fieldLabel: 'Private key file (.p12)',
			                xtype: 'textfield',
			                name: 'debugPrivateKeyFile',
			                anchor: '100%'
		                }
	                ]
                }
            ]
	        },
			{
				xtype: 'projectresources',
				storeName: 'project.IOSResources'
			}]
	   })

        this.callParent( arguments )
    }
})