Ext.define('Spelled.view.scene.plugin.SceneTreeDropZone' ,{
    extend: 'Ext.tree.ViewDropZone',

	nodeOverCls: 'dragged-node-highlight',

	isValidDropPoint : function(node, position, dragZone, e, data) {
		if (!node || !data.item || !data.records) return false

		var view           = this.view,
			draggedRecords = data.records,
			targetNode     = view.getRecord( node ),
			valid          = false


		Ext.Array.each(
			draggedRecords,
			function( record ) {
				switch( record.get( 'iconCls' ) ) {
					case 'tree-system-icon':
						valid = this.checkSystemDrag( targetNode, position, record )
						break
					case 'tree-scene-entity-icon':
					case 'tree-scene-entity-linked-icon':
					case 'tree-scene-entity-readonly-icon':
						valid = this.checkEntityDrag( record, targetNode, position )
						if( valid ) {
							var owner = ( position == 'append' ) ? targetNode : targetNode.parentNode

							if( owner != record.parentNode ){
								valid = !owner.findChild( 'text', record.get( 'text' ) )
							}
						}
						break
				}

				if( !valid ) return false
			},
			this
		)

		if (Ext.Array.contains(draggedRecords, targetNode)) valid = false

		if( !valid ) return false

		return view.fireEvent('nodedragover', targetNode, position, data, e) !== false
	},


	onNodeOut: function( nodeData, source, e, data ) {
		var el          = Ext.fly( nodeData ),
			nodeOverCls = this.nodeOverCls

		if( el && el.hasCls( nodeOverCls ) ) {
			el.removeCls( nodeOverCls )
		}
	},

	onNodeOver: function( nodeData, source, e, data ) {
		var el     = Ext.fly( nodeData ),
			result = this.callParent( arguments )

		if( el ) {
			var nodeOverCls = this.nodeOverCls

			if( result == 'x-tree-drop-ok-append' ) {
				// mark the currently targeted node as active
				if( !el.hasCls( nodeOverCls ) ) {
					el.addCls( nodeOverCls )
				}

			} else {
				el.removeCls( nodeOverCls )
			}
		}

		return result
	},

	getSceneId: function( node ) {
		var type = node.get( 'iconCls' )

		if( type === 'tree-scene-icon' || type === 'tree-default-scene-icon' ) return node.getId()
		else return this.getSceneId( node.parentNode )
	},

	checkSystemDrag: function( targetNode, position, draggedNode ) {
		var targetNodeType = targetNode.get( 'iconCls' ),
			parentNode     = targetNode.parentNode,
			parentNodeType = parentNode.get( 'iconCls' )

		if( this.getSceneId( targetNode ) !== this.getSceneId( draggedNode ) ) return false

		if( targetNodeType === 'tree-system-icon' && parentNodeType === 'tree-system-folder-icon' ) return true
		if( targetNodeType === 'tree-system-folder-icon' && position === 'append' ) return true

		return false
	},

	checkEntityDrag: function( draggedNode, dropNode, position ) {
		var dropNodeId = dropNode.getId()

		if( draggedNode.getId() === dropNodeId ) return false

		// check if the dropNode is already a descendant of draggedNode
		if( this.hasDescendantNode( draggedNode, dropNodeId ) ) return false

		var targetNodeType = dropNode.get( 'iconCls' )

		return ( targetNodeType === 'tree-scene-entity-icon' ||
			targetNodeType === 'tree-scene-entity-linked-icon' ||
			targetNodeType === 'tree-scene-entity-readonly-icon' ||
			( targetNodeType === 'tree-entities-folder-icon' && position === 'append' ) )
	},

	hasDescendantNode: function( node, soughtAfterNodeId ) {
		var childNodes = node.childNodes

		for( var i = 0, childNode, n = childNodes.length; i < n; i++ ) {
			childNode = childNodes[ i ]

			if( childNode.getId() === soughtAfterNodeId ||
				this.hasDescendantNode( childNode, soughtAfterNodeId ) ) {

				return true
			}
		}

		return false
	}
})
