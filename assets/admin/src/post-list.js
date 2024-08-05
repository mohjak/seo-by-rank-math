/*!
 * Rank Math
 *
 * @version 0.9.0
 * @author  RankMath
 */

/**
 * External Dependencies
 */
import jQuery from 'jquery'
import { includes, startsWith } from 'lodash'

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n'

/**
 * Internal Dependencies
 */
import showCTABox from '@helpers/showCTABox'

class RankMathPostList {
	/**
	 * Class constructor
	 */
	constructor() {
		this.addButtons()
		this.bulkEvents()
		this.editingEvents()
		this.saveEvents()
	}

	addButtons() {
		jQuery( '.tablenav .bulkactions select' ).find( 'option[value="rank_math_ai_options"]' ).attr( 'disabled', 'disabled' )

		const headers = jQuery(
			'#rank_math_seo_details, #rank_math_title, #rank_math_description, #rank_math_image_alt, #rank_math_image_title'
		)
		headers.each( function() {
			const $this = jQuery( this )

			$this.append(
				' <a href=#" class="dashicons dashicons-edit" title="' +
					__( 'Bulk Edit This Field', 'rank-math' ) +
					'"></a>'
			)
			$this.wrapInner( '<span/>' )
			$this.append(
				' <span><a href="#" class="button button-primary button-small rank-math-column-save-all">' +
					__( 'Save All Edits', 'rank-math' ) +
					'</a> <a href="#" class="button-link button-link-delete rank-math-column-cancel-all">' +
					__( 'Cancel', 'rank-math' ) +
					'</a></span>'
			)
		} )

		headers.on(
			'click',
			'.dashicons-edit, .rank-math-column-cancel-all',
			function( event ) {
				event.preventDefault()
				const $this = jQuery( this ).closest( 'th' )

				if (
					jQuery( this ).hasClass( 'rank-math-column-cancel-all' )
				) {
					headers.removeClass( 'bulk-editing' )
					jQuery(
						'.rank-math-column-cancel',
						'td.bulk-editing.dirty'
					).trigger( 'click' )
					jQuery( 'td.bulk-editing' ).removeClass( 'bulk-editing' )
				} else {
					$this.toggleClass( 'bulk-editing' )
					jQuery( 'td.column-' + $this.attr( 'id' ) ).toggleClass(
						'bulk-editing'
					)
				}
			}
		)
	}

	bulkEvents() {
		const selectBox = jQuery( '.tablenav .bulkactions select' )
		selectBox.find( 'option[value="rank_math_ai_options"]' ).attr( 'disabled', 'disabled' )
		selectBox.find( 'option[value="rank_math_options"]' ).attr( 'disabled', 'disabled' )
		const contentAiOptions = [
			'rank_math_content_ai_fetch_seo_title',
			'rank_math_content_ai_fetch_seo_description',
			'rank_math_content_ai_fetch_seo_title_description',
		]
		selectBox.on( 'change', () => {
			const value = selectBox.val()
			if (
				value === 'rank_math_content_ai_fetch_image_alt' &&
				( rankMath.contentAICredits < 50 || ! rankMath.isUserRegistered )
			) {
				selectBox.val( '-1' ).change()
				showCTABox( { isBulkEdit: true, creditsRequired: 50 } )
				return
			}

			if (
				includes( contentAiOptions, value ) &&
				(
					! rankMath.isUserRegistered ||
					! rankMath.contentAICredits ||
					! rankMath.contentAIPlan ||
					'free' === rankMath.contentAIPlan
				)
			) {
				selectBox.val( '-1' ).change()
				showCTABox( { isBulkEdit: true } )
			}

			if ( startsWith( value, 'rank_math_bulk' ) && ! rankMath.isProActive ) {
				selectBox.val( '-1' ).change()
				showCTABox( { showProNotice: true, isBulkEdit: true } )
			}
		} )
	}

	editingEvents() {
		jQuery( '.rank-math-column-value' )
			.on( 'input', function() {
				const $this = jQuery( this )
				const td = $this.closest( 'td' )
				const val = $this.val()

				if ( val !== $this.prev().text() ) {
					td.addClass( 'dirty' )
				} else {
					td.removeClass( 'dirty' )
				}
			} )
			.on( 'keypress', function( event ) {
				if ( 13 === event.keyCode ) {
					jQuery( this )
						.parent()
						.find( '.rank-math-column-save' )
						.trigger( 'click' )
					return false
				}
			} )

		jQuery( '.rank-math-column-cancel' ).on( 'click', function( event ) {
			event.preventDefault()
			const $this = jQuery( this ).closest( 'td' )

			$this.removeClass( 'dirty' )
			let display = $this
				.find( '.rank-math-column-value' )
				.prev( '.rank-math-column-display' )

			if ( display.find( 'span' ).length ) {
				display = display.find( 'span' )
			}

			let value = display.html()
			const emojis = value.match( /<img\s+[^>]*?src=("|')([^"']+)">/gm )
			if ( emojis ) {
				for ( const img of emojis ) {
					let emoji = img.match( /alt=("|')([^"']+)/gm )[ 0 ]
					emoji = emoji.replace( 'alt="', '' )

					value = value.replaceAll( img, emoji )
				}
			}

			$this.find( '.rank-math-column-value' ).val( value )
		} )
	}

	saveEvents() {
		const self = this

		jQuery( '.rank-math-column-save-all' ).on( 'click', function( event ) {
			event.preventDefault()

			const $this = jQuery( this )
			const data = {}
			const columns = []

			jQuery( '.dirty.bulk-editing' ).each( function() {
				const column = jQuery( this )
				const postID = parseInt(
					column
						.closest( 'tr' )
						.attr( 'id' )
						.replace( 'post-', '' )
				)
				const valueField = column.find( '.rank-math-column-value' )

				columns.push( column )
				data[ postID ] = data[ postID ] || {}
				data[ postID ][ valueField.data( 'field' ) ] = valueField.val()
			} )

			if ( jQuery.isEmptyObject( data ) ) {
				jQuery( $this.next() ).trigger( 'click' )
				return true
			}

			self.save( data ).done( function( results ) {
				if ( results.success ) {
					columns.forEach( function( column ) {
						self.setColumn( column )
					} )

					jQuery( $this.next() ).trigger( 'click' )
				}
			} )
		} )

		jQuery( '.rank-math-column-save' ).on( 'click', function( event ) {
			event.preventDefault()

			const column = jQuery( this ).closest( '.dirty' )
			const postID = parseInt(
				column
					.closest( 'tr' )
					.attr( 'id' )
					.replace( 'post-', '' )
			)
			const valueField = column.find( '.rank-math-column-value' )

			const data = {}
			data[ postID ] = {}
			data[ postID ][ valueField.data( 'field' ) ] = valueField.val()

			self.save( data ).done( function( results ) {
				if ( results.success ) {
					self.setColumn( column )
				}
			} )
		} )
	}

	setColumn( column ) {
		column.removeClass( 'dirty bulk-editing' )
		let display = column
			.find( '.rank-math-column-value' )
			.prev( '.rank-math-column-display' )

		if ( display.find( 'span' ).length ) {
			display = display.find( 'span' )
		}

		const value = column.find( '.rank-math-column-value' ).val()
		display.text( value )
	}

	save( data ) {
		return jQuery.ajax( {
			url: rankMath.endpoint + '/updateMetaBulk',
			method: 'POST',
			beforeSend( xhr ) {
				xhr.setRequestHeader( 'X-WP-Nonce', rankMath.restNonce )
			},
			data: {
				rows: data,
			},
		} )
	}
}

jQuery( function() {
	new RankMathPostList()
} )
