Ext.define('Spelled.controller.Components', {
    extend: 'Ext.app.Controller',
	requires: [
		'Spelled.view.component.Properties',
		'Spelled.view.component.property.AssetId',
		'Spelled.view.component.Add',
		'Spelled.view.component.AddButton',
		'Spelled.model.config.Component',
		'Spelled.store.config.Components',
		'Spelled.view.component.property.Contextmenu',
		'Spelled.base.grid.property.Grid',
		'Spelled.base.view.GroupedTreeList',
		'Spelled.view.library.menu.item.CopyIdentifier',
		'Spelled.store.property.Mappings',
		'Spelled.store.grouping.Components',
		'Spelled.store.BlacklistedComponentAttributes',
		'Spelled.Converter',
		'Spelled.Compare'
	],

    views: [
        'component.Properties',
		'component.property.AssetId',
		'component.Add',
		'component.AddButton',
		'component.property.Contextmenu'
    ],

    models: [
        'config.Component'
    ],

    stores: [
		'BlacklistedComponentAttributes',
    	'config.Components',
		'property.Mappings',
		'grouping.Components'
    ],

	refs: [
		{
			ref : 'RightPanel',
			selector: '#RightPanel'
		},
		{
			ref : 'SceneEditor',
			selector: '#SceneEditor'
		},{
			ref : 'LibraryTree',
			selector: '#LibraryTree'
		}
	],

	init: function() {
		this.control({
			//TODO: find out why the selector 'componentproperties field' doesn't work!
			'field': {
				editproperty: this.previewAttributeChange
			},
			'componentproperties': {
				propertycontextmenu: this.showComponentContextmenu,
				edit: this.editProperty,
				canceledit: this.cancelPropertyEdit
			},
			'componentproperties tool-documentation': {
				showDocumentation: this.showDocumentation
			},
			'entitycomponentslist button[action="showAddComponent"]': {
				click: this.showAddComponent
			},
			'entitycomponentslist': {
				afterlayout: this.showAddComponentButton
			},
			'addcomponent button[action="addComponent"]': {
				click : this.addComponent
			},
			'componentpropertycontextmenu [action="toComponentDefaults"]': {
				click: this.revertComponent
			},
			'componentpropertycontextmenu [action="toEntityDefaults"]': {
				click: this.revertComponent
			},
			'componentpropertycontextmenu [action="removeComponent"]': {
				click: this.confirmDelete
			},
			'componentpropertycontextmenu [action="copyComponentIdentifier"]': {
				click: this.copyComponentIdentifier
			}
		})

		this.application.on({
			componentpropertygridupdate: this.refreshComponentPropertyGridValues,
			scope: this
		})
	},

	copyComponentIdentifier: function( button ) {
		var propertyGrid = button.up( 'menu' ).ownerView,
			component    = this.getConfigComponentsStore().getById( propertyGrid.componentConfigId )


		Spelled.app.platform.copyToClipboard( component.get( 'templateId' ) )
	},

	revertComponent: function( button, event ) {
		var menu         = button.up( 'menu' ),
			component    = this.getConfigComponentsStore().getById( menu.ownerView.componentConfigId ),
			config       = ( button.action === 'toEntityDefaults' ) ?
					Ext.Object.merge( {}, component.getTemplateConfig() )
				:
					Ext.Object.merge( {}, component.getComponentTemplateConfig() )

		this.refreshComponentPropertyGridValues( component, config, true )
	},

	refreshComponentPropertyGridValues: function( component, newConfig, sendToEngine ) {
		var componentsList = this.getRightPanel().down( 'entitycomponentslist' ),
			propertyGrid   = componentsList.child( 'componentproperties[componentConfigId='+ component.getId() +']'),
			store          = propertyGrid.getStore()

		Ext.iterate(
			this.transformConfigForGrid( component, newConfig ),
			function( key, value ) {
				var record = store.findRecord( 'name', key, null, null, null, true )
				record.set( value )
				propertyGrid.fireEvent( 'edit', propertyGrid, { grid: propertyGrid, record: record } )
				if( sendToEngine ) this.sendComponentUpdate( component, key, value.value )
			},
			this
		)
	},

	showComponentContextmenu: function( propertyView, event ) {
		var contextmenu = this.application.getController( 'Menu' ).createAndShowView( this.getComponentPropertyContextmenuView(), event, propertyView)

		if( propertyView.isAdditional === false ) {
			contextmenu.down( '[action="toEntityDefaults"]' ).setVisible(true)
		} else {
			contextmenu.down( '[action="removeComponent"]' ).setVisible(true)
		}
	},

	cancelPropertyEdit: function( editor, e ) {
		var value  = e.value,
			column = e.column

		this.previewAttributeChange( column, value, value )
	},

	showDocumentation: function( docString, toolEl, panel ) {
		var componentGrid = panel.up( 'componentproperties' )

		if( !!componentGrid.componentConfigId ) {
			var component = Ext.getStore( 'config.Components' ).getById( componentGrid.componentConfigId ),
				template  = component.getTemplate()

			if( template ) {
				this.application.showDocumentation( "#!/guide/" + template.getDocumentationName() )
			}
		}
	},

	showAddComponentButton: function( panel ) {
		if( !this.addingButton ) {
			this.addingButton = true

			var cmp = panel.down( 'addcomponentbutton' )
			if( !!cmp ) panel.remove( cmp )

			panel.add( Ext.widget( 'addcomponentbutton' ) )

			this.addingButton = false
		}
	},

	confirmDelete: function( button ) {
		var panel = button.up( 'componentpropertycontextmenu' ).ownerView,
			title = panel.title

		if( !!panel.removeAllowed )
			return true
		else {
			Ext.Msg.confirm(
				'Remove '+ title,
				'Should the Component: "' + title + '" be removed?',
				function( button ) {
					if ( button === 'yes' ) {
						this.removeComponent( panel )
						panel.removeAllowed = true
						panel.close()
					}
				},
				this
			)

			return false
		}
	},

	removeComponentFromEntites: function( templateId, componentId ) {
		var entities = Spelled.EntityHelper.getEntitiesByTemplateId( templateId )

		entities.each(
			function( entity ) {
				var component = entity.getComponentByTemplateId( componentId )

				if( component && !Ext.Object.isEmpty( component.get( 'config' ) ) ) {
					component.set( 'additional', true )

				} else if( component ){
					entity.getComponents().remove( component )
				}
			}
		)
	},

	removeComponent: function( panel ) {
		var store     = this.getConfigComponentsStore(),
			component = store.getById( panel.componentConfigId ),
			entity    = component.getEntity()

		this.application.fireEvent( 'sendToEngine', 'component.remove' ,{ entityId: entity.getId(), componentId: component.get( 'templateId' ) } )

		if( entity.get( 'type' ) === "entityTemplate" ) {
			this.removeComponentFromEntites( entity.getFullName(), component.get( 'templateId' ) )
		}

		entity.getComponents().remove( component )
		entity.setDirty()
		store.remove( component )
	},

	showAddComponent: function( button ) {
		var view   = Ext.widget( 'addcomponent' ),
			entity = button.up('entitycomponentslist').entity,
			availableComponentsView = view.down( 'treepanel' ),
			templateComponentsStore = Ext.getStore( 'template.Components' )


		var rootNode = availableComponentsView.getStore().setRootNode( {
				text: 'Components',
				expanded: true
			}
		)

		var notAssignedComponents = Ext.create( 'Ext.util.MixedCollection' )

		templateComponentsStore.each(
			function( record ) {
				var found = entity.getComponents().find( 'templateId', record.getFullName(), null, null, null, true )

				if( found === -1 ) {
					notAssignedComponents.add( record )
				}
			}
		)

		notAssignedComponents = notAssignedComponents.filterBy(
			function( item ) {
				return !item.isEngineInternal()
			}
		)

		var sortHelper = function( model1, model2, field ) {
			var model1SortOrder = model1.get( field ),
				model2SortOrder = model2.get( field )

			if( !model2SortOrder && model1SortOrder ) return -1
			if( !model1SortOrder && model2SortOrder ) return 1
			if ( model1SortOrder === model2SortOrder) return 0

			return model1SortOrder < model2SortOrder ? -1 : 1
		}

		notAssignedComponents.sortBy(
			function( item1, item2 ) {
				var result = sortHelper( item1, item2, 'title' )

				if( result === 0 ) {
					return sortHelper( item1, item2, 'templateId' )
				} else return result
			}
		)

		this.appendComponentsOnTreeNode( rootNode, notAssignedComponents )
		view.down( 'groupedtree' ).groupTreeNodes()

		rootNode.eachChild(
			function( node ) {
				node.set('checked', false)
			}
		)

		view.entity = entity

		view.show()
	},

	appendComponentsOnTreeNode: function( node, components, appendAttributes, blacklist ) {
		var blStore = Ext.getStore( 'BlacklistedComponentAttributes' ),
			appendAttributes = !!appendAttributes,
			getBlacklistedAttributesByLibraryId = function( id ) {
				var item = blStore.getById( id )

				return ( blacklist && item ) ? item.get( 'attributes' ) : []
			}

		components.each(
			function( component ) {

				var componentTemplate = ( !component.get('templateId') ) ?
					component :
					Ext.getStore( 'template.Components' ).getByTemplateId( component.get('templateId') )

				if( componentTemplate ) {
					var libraryId = componentTemplate.getFullName(),
						text      = ( Ext.isEmpty( componentTemplate.get('title') ) ) ? libraryId : componentTemplate.get('title') + " (" + libraryId + ")",
						blAttr    = getBlacklistedAttributesByLibraryId( libraryId ),
						config    = {
							text      : text,
							id        : component.getId(),
							leaf      : !appendAttributes
						}

					if( !Ext.isEmpty( componentTemplate.get('icon') ) ) config.icon = componentTemplate.get( 'icon' )
					else config.iconCls = "tree-component-icon"

					var newNode = node.createNode( config )
					newNode.set( 'group', componentTemplate.get( 'group' ) )
					if( appendAttributes ) componentTemplate.appendOnTreeNode( newNode, blAttr )

					node.appendChild( newNode )
				}
			}
		)

		return node
	},

	addComponent: function( button ) {
		var window = button.up('window'),
			tree   = window.down('treepanel'),
			form   = window.down('form'),
			records= tree.getView().getChecked(),
			Model  = this.getConfigComponentModel(),
			componentTemplateStore = Ext.getStore('template.Components'),
			entity = window.entity

		this.getRightPanel().removeAll()

		Ext.each(
			records,
			function( record ) {
				entity.setDirty()

				var componentTemplate = componentTemplateStore.getById( record.get('id') )

				if( componentTemplate ) {
					var configComponent = new Model( {
						templateId : componentTemplate.getFullName(),
						config: {}
					})

					configComponent.setEntity( entity )

					entity.getComponents().add( configComponent )

					this.sendAddComponentToEngine( configComponent )
				}
			},
			this
		)

		if( entity.modelName === "Spelled.model.template.Entity" || entity.isTemplateComposite() )
			this.application.getController('templates.Entities').showEntityTemplateComponentsList( entity )
		else
			this.application.getController('Entities').showComponentsList( entity )

		window.close()
	},

	sendAddComponentToEngine: function( component ) {
		var entity = component.getEntity(),
			owner  = entity.getOwner ? entity.getOwner() : entity

		if( owner && owner.get( 'type' ) == 'entityTemplate' ) {
			this.application.fireEvent( 'updateentitytemplatesenginewide', owner )
		} else {
			this.application.fireEvent( 'sendToEngine', 'component.add' ,{ entityId: entity.getId(), componentId: component.get( 'templateId' ) } )
		}
	},

	editProperty: function( editor, e ) {
		var componentConfigId = e.grid.componentConfigId,
			record            = e.record,
			component         = this.getConfigComponentsStore().getById( componentConfigId ),
			config            = Ext.Object.merge( {}, component.get( 'config' ) ),
			defaultConfig     = Ext.Object.merge( {}, component.getComponentTemplateConfig(), component.getTemplateConfig() ),
			name              = record.get( 'name' ),
			entity            = component.getEntity(),
			value             = Spelled.Converter.decodeFieldValue( record.get( 'value' ), component.getAttributeByName( name ).get( 'type' ) )

		if( !Spelled.Compare.isEqual( value, config[ name ] ) ) {
			if( value === null ||
				Spelled.Compare.isEqual( value, defaultConfig[ name ] ) ) {
				delete config[ name ]

			} else {
				config[ name ] = value
			}

			component.set( 'config', config )
			component.setChanged()

			entity.setDirty()

			var entityTemplate = Spelled.EntityHelper.getRootTemplateOwnerFromComponent( component )

			this.application.fireEvent( 'updateentitytemplatesenginewide', entityTemplate )
		}
	},

	createPropertyFromAttribute: function ( attribute, name, value ) {
		var typeName      = attribute.get( 'type' ),
			attributeType = this.getStore( 'template.component.AttributeTypes' ).findRecord( 'name', typeName, null, null, null, true )

		return {
			type: attributeType.get('type'),
			value: Spelled.Converter.convertValueForGrid( value ),
			componentValue: value,
			values: attribute.get('values')
		}
	},

	transformConfigForGrid: function( component, config ) {
		var template        = component.getTemplate(),
			convertedConfig = {}

		Ext.iterate(
			config,
			function( key, value ) {
				var attribute = template.getAttributeByName( key )
				if( attribute && !attribute.isEngineInternal() ) convertedConfig[ key ] = this.createPropertyFromAttribute( template.getAttributeByName( key ), key, value )
			},
			this
		)

		return convertedConfig
	},

	generatePropertyDeepLinkConfig: function( properties ) {
		var config = {},
			store  = this.getPropertyMappingsStore()

		Ext.Object.each(
			properties,
			function( key, value ){
				var record = store.findRecord( 'name', value.type, null, null, null, true )

				if( record ) { config[ key ] = record }
			}
		)

		return config
	},

	createConfigGridView: function( component ) {
        var config   = this.transformConfigForGrid( component, component.getConfigMergedWithTemplateConfig() ),
			template = component.getTemplate(),
			title    = ( Ext.isEmpty( template.get('title') ) ) ? component.get('templateId') : template.get('title'),
			iconUrl  = template.get('icon')

		var icon        = ( Ext.isEmpty( iconUrl ) )? "" : "style='background: url(" + iconUrl +") no-repeat;'",
			iconClass   = ( component.get('additional') ) ? "component-icon" : "linked-component-icon",
			linkedImage = ( !component.get('additional') && !Ext.isEmpty( template.get('icon') ) ) ? "<img src='resources/images/icons/link.png' style='margin-left: -18px;'/>" : "<span/>"

		return {
				xtype: 'componentproperties',
				manageHeight: false,
				title: "<span class='"+ iconClass +"' "+ icon +">" + linkedImage +"</span> <span>" + title +"</span>",
				isAdditional: component.get('additional'),
				source: config,
				componentConfigId: component.getId(),
				propertyDeepLinked: this.generatePropertyDeepLinkConfig( config )
			}
    },

	getComponentScene: function( component ) {
		var getScene = function( entity ) {
			if( !entity || !entity.getOwner ) return

			var owner = entity.getOwner()
			return ( entity.hasScene() ? owner : getScene( owner ) )
		}

		return getScene( component.getEntity() )
	},

	previewAttributeChange: function( field, newValue, oldValue ) {
		var view              = field.up('componentproperties')
		//Workaround because of the bad control-query in this controller
		if( !view ) return

		var	component = this.getConfigComponentsStore().getById( view.componentConfigId ),
			name      = view.getSelectionModel().getLastSelected().get('name')

		this.sendComponentUpdate( component, name, newValue )
	},

	sendComponentUpdate: function( component, name, value, merge ) {
		var activeScene       = this.application.getRenderedScene(),
			sceneEditor       = this.getSceneEditor()

		if ( this.getComponentScene( component ) != activeScene ) return

		if ( activeScene && sceneEditor.isVisible() ) {
			var activeSceneTab = this.application.findActiveTabByTitle( sceneEditor, activeScene.getRenderTabTitle() )

			if( activeSceneTab && activeSceneTab.isVisible() ) {
				var componentConfig = {}

				if( merge )
					componentConfig[ name ] = component.getConfigMergedWithTemplateConfig()[ name ]
				else
					componentConfig[ name ] = Spelled.Converter.decodeFieldValue( value, component.getAttributeByName( name ).get( 'type' ) )

				this.application.fireEvent(
					'sendToEngine',
					'component.update' , {
						entityId    : component.getEntity().getId(),
						componentId : component.get( 'templateId' ),
						config      : componentConfig
					}
				)
			}
		}
	}
});
