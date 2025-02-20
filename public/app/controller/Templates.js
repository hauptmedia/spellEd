Ext.define('Spelled.controller.Templates', {
    extend: 'Ext.app.Controller',

	requires: [
		'Spelled.view.template.Create',
		'Spelled.view.template.FolderPicker',
		'Spelled.view.template.ReadOnly',

		'Spelled.model.template.Component',
		'Spelled.model.template.Entity',
		'Spelled.model.template.System',

		'Spelled.store.template.Types',
		'Spelled.store.template.Components',
		'Spelled.store.template.Entities',
		'Spelled.store.template.Systems'
	],

    TEMPLATE_TYPE_COMPONENT: 'component',
	TEMPLATE_TYPE_ENTITY   : 'entityTemplate',
	TEMPLATE_TYPE_SYSTEM   : 'system',
	TYPE_ENTITY_COMPOSITE  : 'templateEntityComposite',

    views: [
        'template.Create',
        'template.FolderPicker',
		'template.ReadOnly'
    ],

    models: [
        'template.Component',
        'template.Entity',
        'template.System'
    ],

    stores: [
        'template.Types',
        'template.Components',
        'template.Entities',
        'template.Systems'
    ],

    refs: [
        {
            ref : 'MainPanel',
            selector: '#MainPanel'
        },
		{
			ref : 'RightPanel',
			selector: '#RightPanel'
		},
		{
			ref : 'TemplateEditor',
			selector: '#SceneEditor'
		},
		{
			ref: 'TemplatesTree',
			selector: '#LibraryTree'
		},
		{
			ref : 'SecondTabPanel',
			selector: '#SecondTabPanel'
		}
    ],

    init: function() {
		this.listen({
			'component': {
				'librarymenu button[action="showCreateTemplate"]': {
					click: this.showCreateTemplate
				},
				'createtemplate button[action="createTemplate"]' : {
					click: this.createTemplate
				},
				'templateslistcontextmenu menuitemcopyid,templateslistentitycontextmenu menuitemcopyid,scriptslistcontextmenu menuitemcopyid,assetslistcontextmenu menuitemcopyid': {
					click: this.copyIdentifier
				}
			},
			controller:{
				'*': {
					templatecontextmenu: this.showTemplatesContextMenu,
					templatedblclick   : this.openTemplate,
					templateselect     : this.showConfig,
					templatebeforeclose: this.checkIfTemplateIsDirty,
					templateremove     : this.removeTemplateCallback
				}
			}
        })
    },

	copyIdentifier: function() {
		var node = this.application.getLastSelectedNode( this.getTemplatesTree() )

		if( node ) {
			Spelled.app.platform.copyToClipboard( node.get( 'libraryId' ) )
		}
	},

	checkIfTemplateIsDirty: function( panel ) {
		var template = panel.template
		if( template.isDirty() ) {
			var callback =  Ext.bind(
				function( button ) {
					if ( button === 'yes') this.closeTemplateTab( panel )
				},
				this
			)

			this.application.dirtySaveAlert( template, callback )
			return false
		} else {
			return this.closeTemplateTab( panel )
		}
	},

	closeTemplateTab: function( panel ) {
		panel.destroy()
	},

	addDisabledTemplateHeader: function( view ) {
		view.insert( 0,{
				xtype: 'readonlytemplateheader'
			}
		)
	},

	showConfig: function( treeGrid, record ) {
		switch( record.get('cls') ) {
			case this.TEMPLATE_TYPE_COMPONENT:
				this.fireEvent( 'showcomponenttemplateconfig', record.getId() )
				break
			case this.TEMPLATE_TYPE_ENTITY:
				this.application.fireEvent( 'showtemplatecomponents', record.getId() )
				break
			case this.TYPE_ENTITY_COMPOSITE:
				this.application.fireEvent( 'showcompositecomponents', record )
				break
			case this.TEMPLATE_TYPE_SYSTEM:
				var template = this.getTemplateSystemsStore().getById( record.getId() )
				if( template ) this.application.fireEvent( 'showsystemtemplateconfig', template )
				break
		}
	},

    deleteTemplateAction: function( node ) {
        if( !node ) return

		var id = node.get('id')

        switch( node.get('cls') ) {
            case this.TEMPLATE_TYPE_COMPONENT:
				if( !node.isLeaf() ) return
				this.application.getController('templates.Components').removeComponentTemplate( id )
                break
            case this.TEMPLATE_TYPE_ENTITY:
                this.application.getController('templates.Entities').showRemoveEntityTemplateReferences( id )
                break
			case this.TYPE_ENTITY_COMPOSITE:
				this.application.getController('templates.Entities').showRemoveEntityCompositeReferences( id )
				break
            case this.TEMPLATE_TYPE_SYSTEM:
				if( !node.isLeaf() ) return
                this.application.getController('templates.Systems').removeSystemTemplate( id )
                break
            default:
                return
        }
    },

    showTemplatesContextMenu: function( view, record, item, index, e, options ) {
		var node = this.application.getLastSelectedNode( this.getTemplatesTree() )

		switch( node.get('cls') ) {
			case this.TEMPLATE_TYPE_ENTITY:
				this.application.getController('Menu').showTemplatesListEntityContextMenu( e )
				break
			case this.TYPE_ENTITY_COMPOSITE:
				this.application.getController('Menu').showTemplatesListEntityCompositeContextMenu( e )
				break
			default:
				this.application.getController('Menu').showTemplatesListContextMenu( e )
		}
    },

    showCreateTemplate: function( button ) {
        var View  = this.getTemplateCreateView(),
        	view  = new View(),
			combo = view.down('hiddenfield[name="type"]')

		combo.setValue( button.type )

        view.show()

		this.application.fireEvent( 'selectnamespacefrombutton', view, button )
    },

    openTemplate: function( treeGrid, record ) {
		this.showConfig( treeGrid, record )

        var Model      = undefined,
            Controller = undefined,
			store      = undefined

        switch( record.get('cls') ) {
            case this.TEMPLATE_TYPE_COMPONENT:
                Model = this.getTemplateComponentModel()
                Controller = this.application.getController('templates.Components')
				store = this.getTemplateComponentsStore()
                break
            case this.TEMPLATE_TYPE_SYSTEM:
                Model = this.getTemplateSystemModel()
                Controller = this.application.getController('templates.Systems')
				store = this.getTemplateSystemsStore()
                break
			case this.TEMPLATE_TYPE_ENTITY:
				Model = this.getTemplateEntityModel()
				Controller = this.application.getController('templates.Entities')
				store = this.getTemplateEntitiesStore()
				break
			case this.TYPE_ENTITY_COMPOSITE:
				//composites show owner entity as preview
				Model = this.getTemplateEntityModel()
				Controller = this.application.getController('templates.Entities')
				store = this.getTemplateEntitiesStore()
				record = Controller.getOwnerNode( record )
				break
            default:
                return
        }

		var tabPanel = this.getTabPanel(),
			template = store.getById( record.getId() ),
			foundTab = this.application.findActiveTabByTitle( tabPanel, template.getFullName() )

		if( foundTab ) return foundTab

		Controller.openTemplate( template )
    },

	getTabPanel: function() {
		return this.getMainPanel().down( 'splitlayout').isHidden() ? this.getTemplateEditor() : this.getSecondTabPanel()
	},

    removeTemplateCallback: function( template ) {

        if( !this.application.getController('Templates').checkForReferences( template ) ) {
            this.application.getController('Templates').removeTemplate( template )
			this.application.removeSelectedNode( Ext.getCmp( 'LibraryTree' ) )
        } else {
			Spelled.MessageBox.alert( 'Error', 'The Template "' + template.getFullName() + '" is used in this Project and can not be deleted.' +
                '<br>Remove all references to this Template first!')
        }
    },

    removeTemplate: function( template ) {
        this.closeOpenedTabs( template )
		this.getRightPanel().removeAll()

        template.destroy({
			callback: this.refreshStores,
			scope: this
		})

    },

    closeOpenedTabs: function( template ) {
        var editorTab = this.getTabPanel()

        editorTab.items.each(
            function( tab ) {
                if( !!tab.template && template.get('id') === tab.template.get('id') ) {
                    tab.destroy()
                }
            }
        )
    },

	checkForReferences: function( template ) {
		var found    = false,
			union    = Ext.Array.union,
			each     = Ext.each,
			getStore = Ext.getStore

		var checkFunc = function( storeId ) {
			var store  = getStore( storeId )

			store.each(
				function( item ) {
					if( item.get('templateId') === template.getFullName() && !item.get( 'preview' ) ) {
						found = true
						return false
					}
				}
			)
		}

		each(
			[
				'config.Components',
				'config.Entities'
			],
			checkFunc
		)

		getStore( 'config.Scenes' ).each(
			function( scene ) {
				var systems = scene.get( 'systems' ),
					items   = union( systems.render, systems.update )

				each( items, function( system ) {
					if( system.id === template.getFullName() ) {
						found = true
						return false
					}
				})
			}
		)

		return found
	},

    createTemplate: function( button ) {
        var form    = button.up('form').getForm(),
            window  = button.up( 'window' ),
			values  = form.getValues(),
			Model   = undefined,
			store   = undefined,
			content = {
				name: values.name,
				namespace: ( values.namespace === 'root' ) ? '' : values.namespace.substring( 5 ),
				type: values.type
			}

		switch( values.type ) {
			case this.TEMPLATE_TYPE_COMPONENT:
				Model = this.getTemplateComponentModel()
				store = this.getTemplateComponentsStore()
				break
			case this.TEMPLATE_TYPE_SYSTEM:
				Model = this.getTemplateSystemModel()
				store = this.getTemplateSystemsStore()
				break
			case this.TEMPLATE_TYPE_ENTITY:
				Model = this.getTemplateEntityModel()
				store = this.getTemplateEntitiesStore()
				break
		}

		if( form.isValid() ){
			content.id = this.application.generateFileIdFromObject( content ) + '.json'
			var model = Model.create( content )

			if( values.type === this.TEMPLATE_TYPE_SYSTEM ) {
				model.set( 'content', this.application.getController( 'templates.Systems' ).createSystemScaffolding( model.getFullName(), model.get( 'name' ) ) )

				model.getConfig().add( {
					"name": "active",
					"type": "boolean",
					"default": true,
					"doc": "if active is false the system will be skipped during processing"
				} )

			} else if( values.type === this.TEMPLATE_TYPE_COMPONENT ) {
				model.set( 'content', this.application.getController( 'templates.Components' ).createComponentScaffolding( model.getFullName(), model.get( 'name' ) ) )
			}

			if( values.owner ) {
				this.application.getController( 'templates.Entities' ).convertEntity( values.owner, model )
			}

			this.application.getActiveProject().setDirty()
			model.justCreated = true

			model.save( {
				success: function( result ) {
					Ext.Msg.alert( 'Success', 'Your Template "' + result.get( 'templateId' ) + '" has been created.' )

					model.justCreated = false

					// needed for template conversion
					if( values.owner ) {
						Model.load( result.getId(), {
							success: function( convertedTemplate ) {
								store.add( convertedTemplate )
								var entity = Ext.getStore( 'config.Entities' ).getById( values.owner )

								entity.setDirty()
								this.application.fireEvent( 'refreshentitynode', values.owner )

								// notify engine instances of entity template update
								if( convertedTemplate ) {
									this.application.fireEvent( 'updateentitytemplatesenginewide', convertedTemplate )
								}
							},
							scope: this
						} )

					} else {
						store.add( result )
					}

					window.close()
				},
				scope: this
			} )
		}
    },

    loadTemplateStores: function( callback ) {
		var finished = 0,
			stores   = [
				'template.Components',
				'template.Entities',
				'template.Systems'
			],
			called   = function() {
				if( ++finished >= stores.length && !!callback ) callback()
			}

		Ext.each(
			stores,
			function( storeName ) {
				Ext.getStore( storeName ).load( { callback: called, scope: this } )
			}
		)
    },

    refreshStores: function() {
        this.loadTemplateStores()
    }
});
