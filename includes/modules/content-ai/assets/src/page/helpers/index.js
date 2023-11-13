/**
 * External dependencies
 */
import jQuery from 'jquery'
import classnames from 'classnames'
import { isNull, find } from 'lodash'

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n'
import { addFilter } from '@wordpress/hooks'
import { render } from '@wordpress/element'
import { Button } from '@wordpress/components'

/**
 * Internal dependencies
 */
import getTools from './getTools'
import MyModal from '../modal'
import getData from './getData'
import contentAiCompleters from '../autoCompleter'
import hasError from './hasError'
import isGutenbergAvailable from '@helpers/isGutenbergAvailable'

export default () => {
	if ( hasError() ) {
		return
	}

	// Filter to add Generate with AI button in SERP modal.
	addFilter(
		'rank_math_before_serp_devices',
		'rank-math',
		( value, endpoint = 'SEO_Meta' ) => {
			const className = classnames( 'rank-math-content-ai-meta-button button button-small button-primary', {
				'is-new': ! rankMath.ca_viewed,
				'field-group': 'SEO_Meta' !== endpoint,
			} )

			return (
				<Button
					className={ className }
					onClick={ () => {
						if ( isNull( document.getElementById( 'rank-math-content-ai-modal-wrapper' ) ) ) {
							jQuery( 'body' ).append( '<div id="rank-math-content-ai-modal-wrapper"></div>' )
						}

						const repo = wp.data.select( 'rank-math' )
						const tool = find( getTools(), [ 'endpoint', endpoint ] )
						const params = tool.params
						params.topic.default = repo.getSerpTitle()
						params.post_brief.default = repo.getSerpDescription()
						params.focus_keyword.default = repo.getKeywords().split( ',' )

						tool.params = params
						render(
							<MyModal data={ tool } callApi={ endpoint === 'SEO_Meta' } />,
							document.getElementById( 'rank-math-content-ai-modal-wrapper' )
						)
					} }
				>
					<i className="rm-icon rm-icon-content-ai"></i>
					{ __( 'Generate With AI', 'rank-math' ) }
				</Button>
			)
		}
	)

	if ( ! isGutenbergAvailable() && ! rankMath.isContentAIPage ) {
		return
	}

	// Filter to add Generate Answer option in FAQ block.
	addFilter( 'rank_math_block_faq_actions', 'rank-math', ( data, props, obj ) => {
		return (
			<>
				<Button
					icon="rm-icon rm-icon-content-ai"
					className="rank-math-faq-content-ai"
					label={ __( 'Generate Answer with Content AI', 'rank-math' ) }
					showTooltip={ true }
					onClick={ () => {
						obj.setQuestionProp( 'content', 'Generating...' )
						getData( 'AI_Command', { command: props.title, choices: 1 }, ( response ) => {
							let content = ''
							setTimeout( () => {
								const value = response[ 0 ].replaceAll( /(?:\r\n|\r|\n)/g, '<br>' ).split( ' ' )
								let count = 0
								let isBr = false
								const counter = setInterval( () => {
									if ( content ) {
										content += '<br>' !== value[ count ] && ! isBr ? ' ' + value[ count ] : value[ count ]
									} else {
										content = value[ count ]
									}

									isBr = '<br>' === value[ count ]

									obj.setQuestionProp( 'content', content )
									count++
									if ( count >= value.length ) {
										clearInterval( counter )
									}
								}, 50 )
							}, 100 )
						} )
					} }
				/>
			</>
		)
	} )

	contentAiCompleters()
}