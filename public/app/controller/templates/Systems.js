Ext.define('Spelled.controller.templates.Systems', {
	extend: 'Ext.app.Controller',
	requires: [
		'Spelled.view.template.system.Configuration',
		'Spelled.view.template.system.Edit',
		'Spelled.view.template.system.Details',
		'Spelled.view.template.system.Input',
		'Spelled.view.template.system.config.Items',
		'Spelled.view.template.system.input.Add',
		'Spelled.view.template.system.input.ComboBox',
		'Spelled.view.script.Editor',

		'Spelled.model.template.System',
		'Spelled.model.template.SystemInputDefinition',
		'Spelled.model.template.SystemConfigItem',
		'Spelled.model.Script',

		'Spelled.store.template.Systems',
		'Spelled.store.template.SystemInputDefinitions',
		'Spelled.store.script.Scripts'
	],

	views: [
		'template.system.Configuration',
		'template.system.Edit',
		'template.system.Details',
		'template.system.Input',
		'template.system.input.Add',
		'template.system.input.ComboBox',
		'template.system.config.Items',
		'script.Editor'
	],

	models: [
		'template.System',
		'template.SystemInputDefinition',
		'template.SystemConfigItem',
		'Script'
	],

	stores: [
		'template.Systems',
		'template.SystemInputDefinitions',
		'script.Scripts'
	],

	refs: [
		{
			ref : 'MainPanel',
			selector: '#MainPanel'
		},
		{
			ref : 'TemplateEditor',
			selector: '#SceneEditor'
		},
		{
			ref : 'RightPanel',
			selector: '#RightPanel'
		},
		{
			ref : 'SecondTabPanel',
			selector: '#SecondTabPanel'
		},
		{
			ref : 'Navigator',
			selector: '#Navigator'
		},
		{
			ref : 'Scenes',
			selector: '#Scenes'
		},
		{
			ref : 'ScenesTree',
			selector: '#ScenesTree'
		}
	],

	init: function() {
		this.control({
			'sceneeditor scripteditor': {
				scriptchange: Ext.bind( function(){
					var tab = this.getTemplateEditor().getActiveTab()
					if( tab.getXType() === 'scripteditor' && tab.template ) tab.template.setDirty()
				},this)
			},
			'systemtemplateinputlist': {
				edit:            this.dirtyHelper,
				editclick:       this.showInputListContextMenu,
				itemcontextmenu: this.showInputListContextMenu
			},
			'systemtemplateinputlist tool-documentation': {
				showDocumentation: this.showDocumentation
			},
			'systemblueprintinputlist [action="editclick"]': {
				click: this.showInputListContextMenu
			},

			'systemconfig': {
				configchange: this.updateSceneSystemConfig
			},

			'systemtemplateinputlist [action="showAddInput"]' : {
				click: this.showAddInput
			},
			'addinputtotemplate > form > treepanel': {
				select: this.unSelectOtherComponents
			},
			'addinputtotemplate button[action="addInput"]' : {
				click: this.addInput
			}
		})

		this.application.on( {
			showsystemtemplateconfig: this.refreshSystemConfiguration,
			globalsave: this.saveAllSystemScriptsInTabs,
			scope: this
		})
	},

	updateSceneSystemConfig: function( system, source, recordId, value, oldValue ) {
		this.application.fireEvent( 'systemchange', system )
		this.application.getLastSelectedScene().setDirty()
	},

	saveAllSystemScriptsInTabs: function() {
		this.getTemplateEditor().items.each(
			function( panel ) {
				if( panel.getXType() === 'systemtemplateedit' ) this.application.fireEvent( 'savescriptpanel', panel )
			},
			this
		)
	},

	dirtyHelper: function( editor, e ) {
		var model =  e.record
		this.application.fireEvent( 'systemchange', model.getSystem() )
		model.setDirty()
	},

	showDocumentation: function( docString ) {
		this.application.showDocumentation( docString )
	},

	unSelectOtherComponents: function( grid, node ) {
		if( node.get('checked') === true || node.isLeaf() || node.isRoot() ) return

		var root = node.parentNode
		root.eachChild(
			function( child ) {
				if( child.getId() !== node.getId() ) {
					child.set('checked', false)
				}
			}
		)
	},

    showInputListContextMenu: function( view, record, item, index, e, options ) {
        this.application.getController('Menu').showSystemTemplateInputListContextMenu( e )
    },

    addInput: function( button ) {
        var window     = button.up('window'),
            form       = window.down('form'),
            values     = form.getValues(),
            tree       = window.down('treepanel'),
            components = tree.getView().getChecked(),
            componentTemplateStore = Ext.getStore('template.Components'),
			systemTemplate         = this.getRightPanel().down( 'systemtemplatedetails').getForm().getRecord()

		if( components.length == 0 ) {
			return Spelled.MessageBox.alert( 'Missing component', 'Select a component from the tree.' )
		}

        var inputDefinition = Ext.create(
            'Spelled.model.template.SystemInputDefinition',
            {
                name: values.name
            }
        )

        Ext.each(
            components,
            function( component ) {

                var componentTemplate = componentTemplateStore.getById( component.get('id') )

                if( componentTemplate ) {
					inputDefinition.set( 'componentId', componentTemplate.getFullName() )
                }
            }
        )

        systemTemplate.getInput().add( inputDefinition )
		systemTemplate.setDirty()

		this.application.fireEvent( 'systemchange', systemTemplate )
        this.refreshSystemTemplateInputList()
        window.close()
    },

    removeSystemInputDefinition: function( id ) {
        var systemTemplate     = this.getRightPanel().down( 'systemtemplatedetails').getForm().getRecord(),
            store              = Ext.getStore( 'template.SystemInputDefinitions' ),
            input              = store.getById( id )

        systemTemplate.getInput().remove( input )
		systemTemplate.setDirty()
        store.remove( input )

		this.application.fireEvent( 'systemchange', systemTemplate )
        this.refreshSystemTemplateInputList()
    },

    removeSystemTemplate: function( id ) {
        var system = this.getTemplateSystemsStore().getById( id )

		this.application.getController('Templates').removeTemplateCallback( system )
    },

	prepareConfigurationView: function( view, systemTemplate ) {
		var form       = view.down( 'systemtemplatedetails' ),
			inputView  = view.down( 'systemtemplateinputlist' )

		form.loadRecord( systemTemplate )
		form.getForm().setValues( { tmpName: systemTemplate.getFullName() } )

		var dependencyList = view.insert( 0, {
			xtype: 'panel',
			title: 'System dependencies',
			margin: '0 0 5 0',
			frame: true,
			items: [ { xtype: 'spelldependencies', record: systemTemplate } ]
		} )

		if( this.getNavigator().getActiveTab() === this.getScenes() ) {
			var node       = this.application.getLastSelectedNode( this.getScenesTree() ),
				configView = Ext.widget( 'systemconfig', { source: node.systemConfig } )

			view.insert( 1, configView )
		}

		if( systemTemplate.isReadonly() ) {
			inputView.disable()
			dependencyList.disable()
			this.application.getController( 'Templates' ).addDisabledTemplateHeader( view )
		}
		inputView.reconfigure( systemTemplate.getInput() )
	},

	refreshSystemConfiguration: function( template ) {
		var configurationView = Ext.widget( 'systemtemplateconfiguration' )
		this.getRightPanel().removeAll()

		this.prepareConfigurationView( configurationView, template )
		this.getRightPanel().add( configurationView )
		this.refreshSystemTemplateInputList()
	},

    openTemplate: function( systemTemplate ) {
		var templateEditor    = this.getTemplateEditor(),
			configurationView = Ext.widget( 'systemtemplateconfiguration' )

        var editView = Ext.widget( 'systemtemplateedit',  {
                title: systemTemplate.getFullName(),
                template: systemTemplate
            }
        )

        var tab = this.application.createTab( templateEditor, editView )

		this.prepareConfigurationView( configurationView, systemTemplate )
		this.getRightPanel().add( configurationView )
        this.refreshSystemTemplateInputList()

		this.fireEvent( 'refreshscripttab', tab, systemTemplate )
    },

    refreshSystemTemplateInputList: function() {
        var systemTemplate  = this.getRightPanel().down( 'systemtemplatedetails').getForm().getRecord(),
            inputView       = this.getRightPanel().down( 'systemtemplateinputlist' )

		inputView.reconfigure( systemTemplate.getInput() )
    },

	createSystemScaffolding: function( fullName, typeName ) {
		var prefix = [
			"/**",
			" * @class " + fullName,
			" * @singleton",
			" */",
			""
		].join( '\n' )

		var parts = [
			"",
			"/**",
			" * Creates an instance of the system.",
			" *",
			" * @constructor",
			" * @param {Object} [spell] The spell object.",
			" */",
			"var " + typeName + " = function( spell ) {",
			"	",
			"}",
			"",
			typeName + ".prototype = {",
			"	/**",
			" 	 * Gets called when the system is created.",
			" 	 *",
			" 	 * @param {Object} [spell] The spell object.",
			"	 */",
			"	init: function( spell ) {",
			"		",
			"	},",
			"",
			"	/**",
			" 	 * Gets called when the system is destroyed.",
			" 	 *",
			" 	 * @param {Object} [spell] The spell object.",
			"	 */",
			"	destroy: function( spell ) {",
			"		",
			"	},",
			"",
			"	/**",
			" 	 * Gets called when the system is activated.",
			" 	 *",
			" 	 * @param {Object} [spell] The spell object.",
			"	 */",
			"	activate: function( spell ) {",
			"		",
			"	},",
			"",
			"	/**",
			" 	 * Gets called when the system is deactivated.",
			" 	 *",
			" 	 * @param {Object} [spell] The spell object.",
			"	 */",
			"	deactivate: function( spell ) {",
			"		",
			"	},",
			"",
			"	/**",
			" 	 * Gets called to trigger the processing of game state.",
			" 	 *",
			"	 * @param {Object} [spell] The spell object.",
			"	 * @param {Object} [timeInMs] The current time in ms.",
			"	 * @param {Object} [deltaTimeInMs] The elapsed time in ms.",
			"	 */",
			"	process: function( spell, timeInMs, deltaTimeInMs ) {",
			"		",
			"	}",
			"}",
			"",
			"return " + typeName
		]

		return this.application.getController( 'Scripts' ).createModuleHeader( fullName, parts.join( '\n\t\t' ), prefix )
	},

    showAddInput: function( ) {
        var View = this.getTemplateSystemInputAddView(),
            view = new View(),
            availableComponentsView = view.down( 'groupedtree' ),
            templateComponentsStore = Ext.getStore( 'template.Components' )


        var rootNode = availableComponentsView.getStore().setRootNode( {
                text: 'Components',
                expanded: true
            }
        )

        this.application.getController('Components').appendComponentsOnTreeNode( rootNode, templateComponentsStore )
		availableComponentsView.groupTreeNodes()

        rootNode.eachChild(
            function( node ) {
                node.set('checked', false)
            }
        )
        view.show()
    }
});
