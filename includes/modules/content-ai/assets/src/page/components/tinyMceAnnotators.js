/**
 * External dependencies
 */
import jQuery from 'jquery'
import { isEmpty, forEach } from 'lodash'

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n'
import { addAction } from '@wordpress/hooks'

import getData from '../helpers/getData'

const onClick = ( e ) => {
	jQuery( e.target ).parent().attr( 'data-mce-selected', false )
	const parent = jQuery( e.target ).parents( 'p' )
	const paragraph = document.createElement( 'p' )
	paragraph.textContent = __( 'Generating…', 'rank-math' )
	const text = parent.html()
	parent.before( paragraph )

	getData( 'Text_Summarizer', { text, language: rankMath.ca_language, format: 'paragraph', choices: 1 }, ( response ) => {
		paragraph.textContent = response[ 0 ]
	} )
}

export default () => {
	if ( 'classic' !== rankMath.currentEditor ) {
		return
	}

	const buttons = []
	addAction( 'rank_math_content_refresh', 'rank-math', () => {
		setTimeout( () => {
			const editor = window.tinymce.get( window.wpActiveEditor )
			const annotations = editor.annotator.getAll( 'rank-math-annotations' )
			if ( isEmpty( annotations ) ) {
				if ( ! isEmpty( buttons ) ) {
					forEach( buttons, ( button ) => ( button.remove() ) )
				}
				return
			}

			forEach( annotations[ 'rank-math-annotation' ], ( annotation ) => {
				let tooltip = annotation.getElementsByClassName( 'rank-math-content-ai-tooltip' )
				if ( tooltip.length ) {
					return
				}

				tooltip = document.createElement( 'button' )
				tooltip.className = 'rank-math-content-ai-tooltip'
				tooltip.textContent = __( 'Shorten with AI', 'rank-math' )

				tooltip.addEventListener( 'click', onClick )
				buttons.push( tooltip )
				annotation.appendChild( tooltip )
			} )
		}, 1000 )
	} )
}
