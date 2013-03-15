Ext.define('Spelled.view.system.ContextMenu', {
    extend: 'Ext.menu.Menu',
    alias : 'widget.scenesystemslistcontextmenu',

	items: [
		{
			icon: 'resources/images/icons/system-add.png',
			text: 'Add system',
			action: 'showAddSystem'
		}
	]
});
