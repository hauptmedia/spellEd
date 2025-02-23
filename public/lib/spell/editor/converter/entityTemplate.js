define(
	'spell/editor/converter/entityTemplate',
	[
		'spell/editor/converter/entity',

		'underscore'
	],
	function(
		entityFormatter,

		_
		) {
		'use strict'


		/**
		 * Transforms the supplied entity template from the editor format to the spell engine format.
		 *
		 * @param entity
		 * @param includeEmptyComponents
		 * @return {*}
		 */
		var toEngineFormat = function( entity, includeEmptyComponents ) {
			var result = _.pick( entity, 'version', 'type', 'dependencies' )

			result.config = _.reduce(
				entity.getComponents,
				function( memo, component ) {
					memo[ component.templateId ] = component.config

					return memo
				},
				{}
			)

			result.children = _.map(
				entity.getChildren,
				function( child ) {
					return entityFormatter.toEngineFormat( child, includeEmptyComponents )
				}
			)

			return result
		}

		/**
		 * Transforms the supplied entity template from the spell engine format to the editor format.
		 *
		 * @param entity
		 * @return {*}
		 */
		var toEditorFormat = function( entity ) {
			var result = _.pick( entity, 'name', 'namespace', 'type', 'id', 'readonly', 'dependencies' )

			result.components = _.reduce(
				entity.config,
				function( memo, componentConfig, componentId ) {
					return memo.concat( {
						templateId : componentId,
						config : componentConfig
					} )
				},
				[]
			)

			if( !!entity.children &&
				_.size( entity.children ) > 0 ) {

				result.children = _.map(
					entity.children,
					function( child ) {
						return entityFormatter.toEditorFormat( child )
					}
				)
			}

			return result
		}

		return {
			toEngineFormat : toEngineFormat,
			toEditorFormat : toEditorFormat
		}
	}
)
