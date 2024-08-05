/**
 * External dependencies
 */
import { map, isEmpty, isObject, startCase } from 'lodash'

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n'
import { Button } from '@wordpress/components'
import { useState } from '@wordpress/element'

/**
 * Internal dependencies
 */
import CopyButton from '../components/CopyButton'
import deleteOutput from '../helpers/deleteOutput'
import markdownConverter from '../helpers/markdownConverter'

const getContent = ( value, endpoint ) => {
	if ( ! isObject( value ) ) {
		return markdownConverter( value )
	}

	let content = ''
	if ( 'Frequently_Asked_Questions' === endpoint ) {
		map( value, ( val ) => {
			content += '<h4>' + val.question + '</h4><span>' + val.answer + '</span>'
		} )

		return content
	}

	map( value, ( val, title ) => {
		content += '<h4>' + startCase( title ) + '</h4><span>' + val + '</span>'
	} )

	return markdownConverter( content )
}

// History Tab Component.
export default ( props ) => {
	const [ outputs, setOutputs ] = useState( props.data.history )
	return (
		<div className="history-container">
			<div className="tab-header">
				<span className="tab-header-title">
					<span className="rm-icon rm-icon-dataset"></span> { __( 'AI History', 'rank-math' ) }
				</span>
				{
					! isEmpty( outputs ) &&
					<Button
						className="button clear-history is-small is-link button-link-delete"
						onClick={ () => {
							deleteOutput( false )
							setOutputs( [] )
						} }
					>
						{ __( 'Clear History', 'rank-math' ) }
					</Button>
				}
			</div>
			<div className="inner-wrapper">
				{
					! isEmpty( outputs ) &&
						map( outputs, ( value, key ) => {
							const content = getContent( value.output, value.key )
							return (
								<div className="output-item" key={ key }>
									<div className="tool-name">{ value.key }</div>
									<div className="output-actions">
										<CopyButton value={ content } />
									</div>
									<div className="word-count">{ __( 'Words:', 'rank-math' ) } { content.split( ' ' ).length }</div>
									<div className="content" dangerouslySetInnerHTML={ { __html: content } }></div>
								</div>
							)
						} )
				}
				{
					isEmpty( outputs ) &&
					<div className="no-output">
						{ __( 'No AI History found.', 'rank-math' ) }
					</div>
				}
			</div>
		</div>
	)
}
