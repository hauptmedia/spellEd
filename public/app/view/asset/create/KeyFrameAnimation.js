Ext.define('Spelled.view.asset.create.KeyFrameAnimation', {
    extend: 'Ext.container.Container',
    alias: 'widget.keyframeanimationconfig',

	padding: 5,

	initComponent: function() {
		var me    = this,
			store = Ext.getStore( 'asset.KeyFrameAnimationPreviews' )

		store.load()

		Ext.applyIf( me, {
			items: [
				{
					xtype: 'tool-documentation',
					docString: "#!/guide/asset_type_key_frame_animation",
					width: 'null'
				},
				{
					xtype: 'assetidproperty',
					queryMode: 'local',
					store: store,
					fieldLabel: 'Preview asset',
					listeners: {
						select: Ext.bind( me.onSelectAsset, this ),
						added: function() {
							this.getStore().load()
						},
						beforequery: function(qe){
							qe.query = new RegExp(qe.query, 'i')
							qe.forceAll = true
						}
					}
				},
				{
					xtype: 'numberfield',
					name: 'length',
					minValue: 1,
					fieldLabel: 'Animation length'
				},
				{
					border: null,
					items:[
						{
							xtype: 'treepanel',
							title: 'Choose a component attribute',
							rootVisible: false
						},
						{
							listeners: {
								edit: me.sortGridByTimeColumn
							},
							hidden: true,
							xtype: 'gridpanel',
							enableColumnHide: false,
							sortableColumns: false,
							name: 'attributeConfig',
							selType: 'rowmodel',
							plugins: [{
								ptype: 'cellediting',
								clicksToEdit: 1
							}],
							bbar: [
								{
									icon: 'resources/images/icons/add.png',
									text: "Add",
									action: "addFrame"
								}
							],
							columns: [
								{
									header: 'Time in ms',
									dataIndex: 'time',
									width: 120,
									editor: {
										xtype: 'spelledintegerfield',
										allowBlank: false
									}
								},
								{
									header: 'value',
									width: 120,
									dataIndex: 'value',
									editor: {
										xtype: 'textfield',
										allowBlank: false
									}
								},
								{
									header: 'Easing function',
									dataIndex: 'interpolation',
									flex:1,
									editor: {
										xtype        : 'combobox',
										forceSelection: true,
										typeAhead    : true,
										emptyText    : '-- Select a Interpolation Function --',
										queryMode	 : 'local',
										store        : 'asset.InterpolationFunctions',
										name         : 'name',
										displayField : 'name',
										valueField   : 'name',
										listClass    : 'x-combo-list-small',
										allowBlank   : false
									}
								},
								{
									xtype: 'spelledactioncolumn'
								}
							]
						}
					]
				}
			]
		})

		me.callParent()
	},

    onSelectAsset: function( combobox ) {
        var asset = this.up( 'form').getForm().getRecord()
        if( asset ) this.fireEvent( 'refreshassetpreview', this.up('form').down( 'assetiframe' ) , asset, combobox.getValue() )
    },

	sortGridByTimeColumn: function( editor, e) {
		e.record.store.sort()
	}
});
