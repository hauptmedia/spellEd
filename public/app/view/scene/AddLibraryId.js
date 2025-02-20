Ext.define('Spelled.view.scene.AddLibraryId', {
    extend: 'Ext.window.Window',
    alias : 'widget.sceneaddlibraryid',
	closable: true,

	autoShow: true,
	modal: true,
	multiple: false,

	initComponent: function() {
		var me    = this,
			store = this.generateStore()

		Ext.applyIf( me, {
			title: this.multiple ? "Add dependencies" : "Add dependency",
			items: [
				{
					xtype: 'form',
					padding: 5,
					border: false,
					items: [
						this.generateSelector( store )
					],
					buttons: [
						{
							xtype: 'button', text: 'Add',
							handler: Ext.bind( me.handleAddClick, me )
						},
						{
							xtype: 'button', text: 'Cancel',
							handler: function() { me.close() }
						}
					]
				}
			]
		})

		me.callParent( arguments )
	},

	generateStore: function() {
		var all      = Ext.getStore( 'Library' ).getAllLibraryIds(),
			excluded = this.excludingIds,
			store    = Ext.create( 'Ext.data.Store', {
				fields: [ 'libraryId', 'type' ]
			})

		Ext.Array.each(
			all,
			function( item ) {
				if( !Ext.Array.contains( excluded, item.libraryId ) ) store.add( item )
			}
		)

		if( this.multiple ) {
			var rootNode  = Ext.getStore( 'Library' ).getRootNode(),
				newRoot   = rootNode.copy(),
				copyNodes = function( node, parent ) {
					var hasLeaf = false

					node.eachChild(
						function( child ) {
							if( Ext.Array.contains( excluded, child.get( 'libraryId' ) ) ) return

							var tmpNode = parent.appendChild( child.copy()),
								config  = child.convertToDependencyObject()

							tmpNode.set( 'checked', false )
							tmpNode.set( config )

							if( tmpNode.get( 'cls' ) == 'entityTemplate' ) {
								tmpNode.set( 'leaf', true )
							}

							copyNodes( child, tmpNode )
						}
					)

					parent.cascadeBy( function() { if( this.isLeaf() ) hasLeaf = true })

					if( !hasLeaf ) parent.remove()
				}

			copyNodes( rootNode, newRoot )

			store = Ext.create( 'Spelled.store.Library', { root: newRoot } )
		} else {
			store.sort( 'libraryId', 'ASC' )
		}

		return store
	},

	generateSelector: function( store ) {
		if( this.multiple ) {
			return {
				xtype: 'treepanel',
				width: 500,
				height: 400,
				rootVisible: false,
				store: store,
				listeners: {
					checkchange: Ext.bind( this.checkChangeHandler, this )
				}
			}
		} else {
			return {
				xtype: 'combo',
				listeners: {
					beforequery: function(qe){
						qe.query = new RegExp(qe.query, 'i')
						qe.forceAll = true
					}
				},
				growToLongestValue: true,
				grow: true,
				emptyText: ' -- Select a library item -- ',
				forceSelection  : true,
				store: store,
				queryMode: 'local',
				valueField: 'libraryId',
				displayField: 'libraryId',
				fieldLabel: 'Library ID',
				name: 'libraryId',
				allowBlank: false
			}
		}
	},


	checkChangeHandler: function( node, checked ) {
		node.cascadeBy( function() { this.set( 'checked', checked ) } )
	},

	handleAddClick: function() {
		var records = []

		if( this.multiple ) {
			var tree    = this.down( 'treepanel' ),
				checked = tree.getChecked()

			Ext.Array.each(
				checked,
				function( node ) {
					if( node.isLeaf() ) records.push( node )
				}
			)

		} else {
			var combo = this.down( 'combo[name="libraryId"]')

			records.push( combo.findRecordByValue( combo.getValue() ) )
		}

		this.fireEvent( 'addToLibrary', this, records )
	}
})
