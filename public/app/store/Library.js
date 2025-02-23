Ext.define('Spelled.store.Library', {
    extend: 'Spelled.base.store.TreeStore',

	requires: ['Spelled.StoreHelper', 'Spelled.model.LibraryNode'],

	model: 'Spelled.model.LibraryNode',

    root: {
        expanded: true,
		cls: 'folder'
    },

	proxy: 'memory',

	sortHelper : function( node1, node2, field ) {
		var node1SortOrder = node1.get( field ),
			node2SortOrder = node2.get( field )

		if ( node1SortOrder === node2SortOrder) return 0

		return node1SortOrder < node2SortOrder ? -1 : 1
	},

	sortFunction: function() {
		var me = this

		this.getRootNode().sort(
			function( node1, node2 ) {
				var result = me.sortHelper( node1, node2, 'sortOrder' )

				if( result === 0 ) {
					return me.sortHelper( node1, node2, 'text' )
				} else return result
			},
			true,
			false
		)
	},

	getNodeByLibraryId: function( libraryId ) {
		return this.getRootNode().findChild( 'libraryId', libraryId, true )
	},

	findLibraryItemByLibraryId: function( libraryId ) {
		var node   = this.getNodeByLibraryId( libraryId ),
			result = null

		if( node ) {
			var type = node.get( 'cls' )

			switch( type ) {
				case 'component':
					result = Ext.getStore( 'template.Components' ).getByTemplateId( libraryId )
					break
				case 'entityTemplate':
					result = Ext.getStore( 'template.Entities' ).getByTemplateId( libraryId )
					break
				case 'scene':
					result = Ext.getStore( 'config.Scenes' ).findRecord( 'sceneId', libraryId, null, null, null, true )
					break
				case 'system':
					result = Ext.getStore( 'template.Systems' ).getByTemplateId( libraryId )
					break
				case 'script':
					result = Ext.getStore( 'script.Scripts' ).findRecord( 'scriptId', libraryId, null, null, null, true )
					break
				default:
					var store = Spelled.StoreHelper.getAssetStoreByType( type )

					if( store ) result = store.findRecord( 'myAssetId', libraryId, null, null, null, true )
			}
		}

		return result
	},

	getAllLibraryIds: function() {
		var ids = []

		var getLeafs = function( node ) {
			if( node.get( 'libraryId' ) && node.get( 'cls' ) != "folder" ) ids.push( node.convertToDependencyObject() )

			node.eachChild( getLeafs )

			return ids
		}


		return getLeafs( this.getRootNode() )
	}
});
