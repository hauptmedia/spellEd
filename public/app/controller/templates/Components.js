Ext.define('Spelled.controller.templates.Components', {
    extend: 'Ext.app.Controller',

	requires: [
		'Spelled.view.template.component.Script',
		'Spelled.view.template.component.Edit',
		'Spelled.view.template.component.Details',
		'Spelled.view.template.component.Attributes',
		'Spelled.view.template.component.Property',
		'Spelled.view.template.component.attribute.Object',
		'Spelled.view.template.component.attribute.Vec2',
		'Spelled.view.template.component.attribute.Vec3',
		'Spelled.view.template.component.attribute.Vec4',
		'Spelled.view.template.component.attribute.Mat3',
		'Spelled.view.template.component.attribute.String',
		'Spelled.view.template.component.attribute.Number',
		'Spelled.view.template.component.attribute.List',
		'Spelled.view.template.component.attribute.Integer',
		'Spelled.view.template.component.attribute.Boolean',
		'Spelled.view.template.component.attribute.Appearance',
		'Spelled.view.template.component.attribute.AnimatedAppearance',
		'Spelled.view.template.component.attribute.KeyFrameAnimation',
		'Spelled.view.template.component.attribute.TextAppearance',
		'Spelled.view.template.component.attribute.Sound',
        'Spelled.view.template.component.attribute.Script',
		'Spelled.view.template.component.attribute.SpriteSheet',
		'Spelled.view.template.component.attribute.InputMap',
		'Spelled.view.template.component.attribute.Translation',
		'Spelled.view.template.component.attribute.TileMap',
		'Spelled.view.template.component.attribute.Enum',

		'Spelled.model.template.Component',
		'Spelled.model.template.ComponentAttribute',

		'Spelled.store.template.component.Attributes',
		'Spelled.store.template.component.AttributeTypes',
		'Spelled.store.template.Components'

	],

    views: [
		'template.component.Script',
        'template.component.Edit',
        'template.component.Details',
        'template.component.Attributes',
        'template.component.Property',
		'template.component.attribute.Object',
		'template.component.attribute.Vec2',
		'template.component.attribute.Vec3',
		'template.component.attribute.Vec4',
		'template.component.attribute.Mat3',
		'template.component.attribute.String',
		'template.component.attribute.Number',
		'template.component.attribute.List',
		'template.component.attribute.Integer',
		'template.component.attribute.Boolean',
		'template.component.attribute.Appearance',
		'template.component.attribute.AnimatedAppearance',
		'template.component.attribute.KeyFrameAnimation',
		'template.component.attribute.TextAppearance',
		'template.component.attribute.Sound',
        'template.component.attribute.Script',
		'template.component.attribute.InputMap',
	    'template.component.attribute.TileMap',
		'template.component.attribute.Enum',
		'template.component.attribute.Translation'
    ],

    models: [
        'template.Component',
        'template.ComponentAttribute'
    ],

    stores: [
        'template.component.Attributes',
		'template.component.AttributeTypes',
        'template.Components'
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
		}
    ],

    init: function() {
		this.listen({
			component: {
				'componenttemplateedit form field': {
					change: this.updateComponent
				},
				'componenttemplateproperty > combobox[name="type"]' : {
					select: this.changedAttributeType
				},
				'componenttemplateattributeslist [action="addAttribute"]' : {
					click: this.addAttribute
				},
				'componenttemplateattributeslist': {
					select:          this.showAttributeConfig,
					editclick:       this.showAttributesListContextMenu,
					itemcontextmenu: this.showAttributesListContextMenu,
					itemmouseenter:  this.application.showActionsOnLeaf,
					itemmouseleave:  this.application.hideActions
				}
			},
			controller: {
				'#Templates': {
					showcomponenttemplateconfig: this.showConfig
				},
				'*': {
					globalsave: this.saveAllComponentScriptsInTabs
				}
			}
		})
    },

	saveAllComponentScriptsInTabs: function() {
		this.getTemplateEditor().items.each(
			function( panel ) {
				if( panel.getXType() === 'componenttemplatescript' ) this.application.fireEvent( 'savescriptpanel', panel )
			},
			this
		)
	},

	updateComponent: function( field, newValue ) {
		var form   = field.up( 'form' ).getForm(),
			record = form.getRecord(),
			values = field.getModelData(),
			view   = this.getRightPanel().down( 'componenttemplateedit' )

		if( Ext.isDefined( record.data[ field.getName() ] ) && newValue != record.get( field.getName()) ){
			record.setDirty()

			if( values['default'] ) values['default'] = Spelled.Converter.decodeFieldValue( values['default'], record.get( 'type' ) )

			record.set( values )
			if( view ) this.refreshComponentTemplateAttributesList( view )
		}
	},

    showAttributesListContextMenu: function( view, record, item, index, e, options ) {
		if( !view.panel.down( 'actioncolumn').isHidden() )
        	this.application.getController('Menu').showComponentAttributesListContextMenu( view, e )
		else
			e.preventDefault()
    },

    addAttribute: function( button ) {
        var panel      = button.up('componenttemplateedit'),
            ownerModel = panel.template

        var newAttribute = Ext.create(
            'Spelled.model.template.ComponentAttribute',
            {
                type: "string",
                name: "newAttribute"
            }
        )

		newAttribute.setComponent( ownerModel )
        ownerModel.getAttributes().add( newAttribute )
		newAttribute.setDirty()

        this.refreshComponentTemplateAttributesList( panel )
    },

    removeComponentTemplate: function( id ) {
        var component = this.getTemplateComponentsStore().getById( id )

        this.application.getController('Templates').removeTemplateCallback( component )
    },

    removeComponentAttribute: function( panel, id ) {
        var componentTemplate  = panel.template,
            store              = Ext.getStore( 'template.component.Attributes' ),
            attribute          = store.getById( id )

        componentTemplate.getAttributes().remove( attribute )
        store.remove( attribute )

		componentTemplate.setDirty()

        this.refreshComponentTemplateAttributesList( panel )
    },

    showAttributeConfig: function( treePanel, record ) {
        if( !record.data.leaf ) return

		var attribute = Ext.getStore('template.component.Attributes').getById( record.getId() )

        if( attribute ) {
            this.fillAttributeConfigView( this.getRightPanel().down( 'componenttemplateproperty' ), attribute )
        }
    },

	changedAttributeType: function( combobox, records ) {
		var propertyView   = combobox.up( 'componenttemplateproperty'),
			attribute      = propertyView.getRecord(),
			selectedRecord = records.pop()

		attribute.set( 'type', selectedRecord.get( 'name' ) )

		this.fillAttributeConfigView( propertyView, attribute )
	},

    fillAttributeConfigView: function( propertyView, attribute ) {
		var attributeType = this.getTemplateComponentAttributeTypesStore().findRecord( 'name', attribute.get('type'), null, null, null, true )

		if( propertyView.down('[name="default"]') ) propertyView.remove( propertyView.down('[name="default"]') )
		if( propertyView.down('[name="values"]') ) propertyView.remove( propertyView.down('[name="values"]') )

		var defaultValueField = {
			xtype: attributeType.get('type'),
			name: 'default',
			allowBlank: false,
			fieldLabel: 'Default value',
			matchFieldWidth: true
		}

		if( attributeType.get('type') === 'spelledenumfield') {
			propertyView.add({
				xtype: 'spelledlistfield',
				name: 'values',
				allowBlank: false,
				fieldLabel: 'Values',
				listeners: {
					change: function( field ) {
						var value    = field.getValue(),
							combobox = this.up( 'componenttemplateproperty' ).down( attributeType.get('type') ),
							store    = combobox.getStore(),
							items    = ( Ext.isString( value ) ) ? value.split(',') : []

						if( value && !store ) {
							combobox.bindStore( items )
						} else if( value ) {
							store.loadRawData( Ext.Array.map( items, function( item ) { return [item] } ) )
						}
					}
				}
			})

			defaultValueField.store = Ext.isArray( attribute.get( 'values' ) ) ? attribute.get( 'values' ) : attribute.get( 'values' ).split(",")
		}

		var field = propertyView.add( defaultValueField )

		propertyView.showConfig()
        propertyView.getForm().loadRecord( attribute )

		if( field.isValid() ) {
			attribute.set( 'default', field.getValue() )
		} else if( attributeType.get( 'defaultValue' ) !== "" ) {
			var defaultValue = attributeType.get( 'defaultValue' )

			field.setValue( defaultValue )
			attribute.set( 'default', Spelled.Converter.decodeFieldValue( defaultValue, attribute.get( 'type' ) ) )
		}
    },

	showConfig: function( componentId ) {
		var componentTemplate = this.getTemplateComponentsStore().getById( componentId ),
			editView = Ext.widget( 'componenttemplateedit',  {
				template : componentTemplate
			}
		)

		var form = editView.down( 'componenttemplatedetails' )
		form.loadRecord( componentTemplate )
		form.getForm().setValues( { tmpName: componentTemplate.getFullName() } )

		if( componentTemplate.isReadonly() ) {
			this.application.getController( 'Templates' ).addDisabledTemplateHeader( editView )

			editView.down('componenttemplatedetails').disable()
			editView.down('componenttemplateproperty').disable()
			editView.down('componenttemplateattributeslist').setReadonly()
		}

		this.refreshComponentTemplateAttributesList( editView )

		this.getRightPanel().removeAll()
		this.getRightPanel().add( editView )
	},

    openTemplate: function( componentTemplate ) {
        var templateEditor = this.getTemplateEditor()

        var scriptView = Ext.widget( 'componenttemplatescript', {
                title: componentTemplate.getFullName(),
                template: componentTemplate
            }
        )

        var tab = this.application.createTab( templateEditor, scriptView )

		this.fireEvent( 'refreshscripttab', tab, componentTemplate )
    },

    refreshComponentTemplateAttributesList: function( view ) {
        var componentTemplate = view.template,
            attributesView    = view.down( 'componenttemplateattributeslist' )

        var rootNode = attributesView.getStore().setRootNode( {
                text: componentTemplate.getFullName(),
                expanded: true
            }
        )

        componentTemplate.appendOnTreeNode( rootNode )
    },

	createComponentScaffolding: function( fullName, typeName ) {
		var parts = [
			"",
			"var " + typeName + " = function( spell ) {",
			"	",
			"}",
			"",
			typeName + ".prototype = {",
			"",
			"}",
			"",
			"return " + typeName
		]

		return this.application.getController( 'Scripts' ).createModuleHeader( fullName, parts.join( '\n\t\t' ) )
	}
});
