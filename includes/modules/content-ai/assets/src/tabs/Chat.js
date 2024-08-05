/**
 * External dependencies
 */
import jQuery from 'jquery'
import { map, reverse, uniqueId, trim, isEmpty, isUndefined } from 'lodash'
import classnames from 'classnames'

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n'
import { useState, useEffect } from '@wordpress/element'
import { Button, SelectControl, Dashicon, Tooltip } from '@wordpress/components'
import { RichText } from '@wordpress/block-editor'

/**
 * Internal dependencies
 */
import PromptModal from '../components/PromptModal'
import getData from '../helpers/getData'
import deleteOutput from '../helpers/deleteOutput'
import markdownConverter from '../helpers/markdownConverter'
import CopyButton from '../components/CopyButton'
import ContentAiText from '../components/ContentAiText'
import FreePlanNotice from '../components/FreePlanNotice'
import ErrorCTA from '@components/ErrorCTA'

// Chat component.
export default ( props ) => {
	const { data, isContentAIPage = false } = props
	const isFree = data.plan === 'free'
	const [ openModal, toggleModal ] = useState( false )
	const [ generating, setGenerating ] = useState( false )
	const [ message, setMessage ] = useState( '' )
	const [ chats, setChats ] = useState( data.chats )
	const [ session, setSession ] = useState( isFree && chats.length ? 0 : '' )

	if ( isFree && chats.length && isUndefined( wp.blocks.getBlockType( 'core/paragraph' ) ) ) {
		wp.blockLibrary.registerCoreBlocks()
	}

	// Select and highlight span on click.
	useEffect( () => {
		jQuery( '.chat-input span' ).on( 'click', ( e ) => {
			if ( ! window.getSelection || ! document.createRange ) {
				return
			}

			const sel = window.getSelection()
			if ( sel.toString() !== '' ) {
				return
			}

			window.setTimeout( () => {
				const el = e.target
				const range = document.createRange()
				range.selectNodeContents( el )
				sel.removeAllRanges()
				sel.addRange( range )
			}, 1 )
		} )
	}, [ message ] )

	const examples = [
		'How do backlinks affect SEO?',
		'Why is keyword research important for SEO?',
		'What are some effective SEO strategies for small businesses?',
		'Can you explain the difference between on-page and off-page SEO?',
		'List trending topics in [Industry] that I should write about.',
		'How can I optimize my website for local search queries?',
		'What are some effective strategies for managing [product/service description] reputation on social media?',
		'Develop a content strategy for [product/service description] to increase organic search traffic.',
	]

	// Prompt examples shown on New chat.
	const ExamplesWrapper = () => {
		return (
			<>
				<div className="prompt-examples">
					<h2>{ __( 'Examples', 'rank-math' ) }</h2>
					<p>{ __( 'Here are some examples of questions you can ask RankBot', 'rank-math' ) }</p>
					<div className="grid">
						{
							map( examples, ( example, key ) => {
								return (
									// eslint-disable-next-line jsx-a11y/click-events-have-key-events
									<div
										role="button"
										tabIndex="0"
										onClick={ () => {
											setMessage( example.replaceAll( '[', '<span>[' ).replaceAll( ']', ']</span>' ) )
										} }
										key={ key }
										dangerouslySetInnerHTML={ {
											__html: example.replaceAll( '[', '<span>[' ).replaceAll( ']', ']</span>' ),
										} }
									>
									</div>
								)
							} )
						}
					</div>
				</div>
			</>
		)
	}

	// Options to select Chat group.
	const getOptions = () => {
		const options = []

		if ( ! isFree || ! chats.length ) {
			options.push(
				{
					label: __( 'New Chat', 'rank-math' ),
					value: '',
				}
			)
		}

		map( chats, ( value, index ) => {
			options.push(
				{
					label: value[ 0 ].content.replace( /(<([^>]+)>)/ig, '' ).split( /\s+/ ).slice( 0, 8 ).join( ' ' ) + '...',
					value: index,
				}
			)
		} )

		return options
	}

	// Function to submit the chat.
	const submitChat = ( text = '', regenerate = false ) => {
		setMessage( '' )
		setGenerating( true )
		if ( session === '' ) {
			setSession( 0 )
		}

		const isNew = session === ''
		const index = session !== '' ? session : data.chats.length
		const chat = isEmpty( chats[ index ] ) ? [] : chats[ index ]
		if ( ! regenerate ) {
			chat.unshift(
				{
					role: 'user',
					content: text ? text : message,
				}
			)
		}

		if ( isNew ) {
			chats.unshift( chat )
		} else {
			chats[ index ] = chat
		}
		setChats( chats )
		setTimeout( () => {
			getData( 'Chat', { messages: reverse( chat ), session: index, isNew, regenerate, site_type: 'ecommerce', site_name: rankMath.blogName, language: data.language, choices: 1 }, ( result ) => {
				reverse( chat )
				if ( result ) {
					chat.unshift(
						{
							role: 'assistant',
							content: result[ 0 ],
							isNew: true,
						},
					)
				}

				setGenerating( false )
			},
			true
			)
		}, 100 )
	}

	return (
		<>
			<div className={ props.hasError ? 'blurred' : '' }>
				<div className="tab-header">
					<span className="tab-header-title">
						<i className="rm-icon rm-icon-bot"></i> RankBot <span>- { __( 'Your Personal Assistant', 'rank-math' ) }</span>
					</span>

					<a href="https://rankmath.com/kb/how-to-use-rankbot-ai-tool/?play-video=OBxuy8u0eCY&utm_source=Plugin&utm_medium=RankBot+Tab&utm_campaign=WP" rel="noreferrer" target="_blank" title={ __( 'Know more about RankBot', 'rank-math' ) }>
						<em className="dashicons-before dashicons-editor-help rank-math-tooltip"></em>
					</a>

					{
						! isContentAIPage && session !== '' &&
						<Button
							className="clear-history is-small button-link-delete"
							onClick={ () => {
								chats.splice( session, 1 )
								setChats( chats )
								deleteOutput( true, session )
								setTimeout( () => {
									setSession( '' )
								}, 10 )
							} }
						>
							{ __( 'Delete Session', 'rank-math' ) }
						</Button>
					}
				</div>
				{ ! isContentAIPage && <FreePlanNotice /> }
				<div className="rank-math-content-chat-page">
					{
						! isEmpty( chats ) &&
						<div className="chat-sidebar">
							<div className="chat-sidebar-content">
								{
									! isContentAIPage &&
									<SelectControl
										value={ session }
										options={ getOptions() }
										onChange={ ( newIndex ) => {
											setSession( newIndex )
										} }
									/>
								}
								{
									isContentAIPage && ! isFree &&
									<Button
										className={
											classnames( 'history-button button new-chat', {
												active: session === '',
											} )
										}
										onClick={ () => {
											setSession( '' )
										} }
									>
										<i className="rm-icon rm-icon-circle-plus"></i> { __( 'New Chat', 'rank-math' ) }
									</Button>
								}
								{
									isContentAIPage &&
									map( chats, ( value, index ) => {
										const title = value.length > 2 ? value[ value.length - 2 ].content : value[ 0 ].content
										return (
											<div
												role="button"
												tabIndex="0"
												className={
													classnames( 'history-button button', {
														active: session === index,
													} )
												}
												key={ index }
												onClick={ () => {
													setSession( index )
												} }
												onKeyDown={ undefined }
											>
												<i className="rm-icon rm-icon-comments"></i>
												{ title.split( /\s+/ ).slice( 0, 8 ).join( ' ' ) + '...' }
												<Button
													className="delete-session"
													onClick={ () => {
														chats.splice( index, 1 )
														setChats( chats )
														deleteOutput( true, index )
														setTimeout( () => {
															setSession( '' )
														}, 10 )
													} }
													title={ __( 'Delete Session', 'rank-math' ) }
												>
													<i className="dashicons dashicons-no-alt"></i>
												</Button>
											</div>
										)
									} )
								}
								{
									isContentAIPage && isFree &&
										<Button
											className="button is-green"
											href="https://rankmath.com/content-ai/#pricing"
											target="_blank"
										>
											{ __( 'Buy PRO plan for Multiple Sessions', 'rank-math' ) }
										</Button>
								}
							</div>
						</div>
					}

					<div className="chat-container">
						<div className="chat-messages">
							{ generating && <div className="chat-message loading"><div className="rank-math-loader"></div></div> }

							{ session === '' && <ExamplesWrapper /> }
							{
								! isEmpty( chats ) && session !== '' &&
								map( chats[ session ], ( value, key ) => {
									if ( isEmpty( value.content ) ) {
										return
									}

									const isUser = 'user' === value.role
									const label = isUser ? __( 'You:', 'rank-math' ) : __( 'RankBot:', 'rank-math' )

									const wrapperID = uniqueId()
									const isNew = value.isNew
									value.isNew = false

									return (
										<div className={ isUser ? 'chat-message user' : 'chat-message' } key={ key }>
											<div className="message-actions">
												<span>{ label }</span>
												{
													! isUser &&
													<CopyButton value={ value.content } />
												}
											</div>
											<div className="message" id={ 'block-' + wrapperID }>
												{ isNew && <ContentAiText value={ value.content } showWordCount={ false } /> }
												{
													! isNew &&
													<div
														dangerouslySetInnerHTML={ {
															__html: markdownConverter( value.content ),
														} }
													></div>
												}
											</div>
										</div>
									)
								} )
							}
						</div>

						{
							( ! isFree || ! session ) &&
							<div className="chat-input">
								<div className="chat-input-actions">
									<RichText
										tagName="div"
										className="chat-input-textarea"
										value={ message.slice( 0, 2000 ) }
										allowedFormats={ [] }
										disableLineBreaks={ true }
										onChange={ ( content ) => {
											const inputWrapper = document.getElementsByClassName( 'chat-input-textarea' )[ 0 ]
											if ( content.length > 2000 ) {
												content = content.slice( 0, 2000 )
												inputWrapper.innerHTML = message
												const range = document.createRange()
												const sel = window.getSelection()
												const childNode = inputWrapper.childNodes[ inputWrapper.childNodes.length - 1 ]
												range.setStart( childNode, childNode.textContent.length )
												range.collapse( true )

												sel.removeAllRanges()
												sel.addRange( range )
											}

											setMessage( content )
										} }
										onKeyUp={ ( e ) => {
											if ( e.key !== 'Enter' ) {
												return
											}

											// Add line break
											if ( e.shiftKey ) {
												setMessage( message + '\n' )

												const selection = window.getSelection()
												const range = selection.getRangeAt( 0 )
												const newLineBreak = document.createElement( 'br' )
												range.insertNode( newLineBreak )
												const nextNode = newLineBreak.nextSibling
												const newRange = document.createRange()
												newRange.setStart( nextNode, 0 )
												newRange.collapse( true )

												selection.removeAllRanges()
												selection.addRange( newRange )

												return
											}

											// Submit chat request.
											if ( ! isEmpty( trim( message ) ) && ! generating ) {
												submitChat()
											}
										} }
										preserveWhiteSpace="true"
										placeholder={ __( 'Type your message here…', 'rank-math' ) }
									/>
									<div className="chat-input-buttons">
										<Button
											className="prompts-button button"
											onClick={ () =>
												toggleModal( true )
											}
										>
											<i className="rm-icon rm-icon-htaccess"></i> { isContentAIPage ? __( 'Prompts Library', 'rank-math' ) : '' }
										</Button>
										<PromptModal { ...props } isOpen={ openModal } toggleModal={ toggleModal } setMessage={ setMessage } />
										{
											session !== '' && ! generating &&
											<Tooltip text={ __( 'Regenerate Response', 'rank-math' ) }>
												<Button
													className="regenerate-response button button-small"
													onClick={ () => {
														const chat = chats[ session ]
														const content = chat[ 1 ].content
														chat.shift()
														chats[ session ] = chat
														setChats( chats )
														submitChat( content, true )
													} }
													showTooltip={ true }
												>
													<Dashicon icon="controls-repeat" />
												</Button>
											</Tooltip>
										}
										<div className={ message.length >= 2000 ? 'limit limit-reached' : 'limit' }>
											<span className="count">{ message.length }</span>/{ __( '2000', 'rank-math' ) }
										</div>
										<Button
											className="button is-primary is-large"
											aria-label={ __( 'Send', 'rank-math' ) }
											disabled={ isEmpty( trim( message ) ) || generating }
											onClick={ () => ( submitChat() ) }
										>
											<span className="rm-icon rm-icon-send"></span>
										</Button>
									</div>
								</div>
							</div>
						}
					</div>
				</div>
			</div>
			{ props.hasError && ! isContentAIPage && <ErrorCTA /> }
		</>
	)
}
