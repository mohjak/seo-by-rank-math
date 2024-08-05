/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n'

/**
 * Print permission warning.
 */
export default () => {
	const reconnectURL = '##' // wp_nonce_url( admin_url( 'admin.php?reconnect=google' ), 'rank_math_reconnect_google' )

	return (
		<p className="warning">
			<strong className="warning">{ __( 'Warning: ', 'rank-math' ) }</strong>

			<span dangerouslySetInnerHTML={ { __html: sprintf(
				/* translators: %s is the reconnect link. */
				__(
					'You have not given the permission to fetch this data. Please <a href="%s">reconnect</a> with all required permissions.',
					'rank-math'
				),
				reconnectURL
			) } } />
		</p>
	)
}
