/***************************************************************************************************************************************************************
 *
 * cfonts
 *
 * Sexy fonts for the console. (CLI output)
 *
 * @license     https://github.com/dominikwilkowski/cfonts/blob/master/LICENSE  GNU GPLv2
 * @author      Dominik Wilkowski  hi@dominik-wilkowski.com
 * @repository  https://github.com/dominikwilkowski/cfonts
 *
 * Render
 *   Main method to get the ANSI output for a string
 *
 **************************************************************************************************************************************************************/

'use strict';

const { AddLetterSpacing } = require('./AddLetterSpacing.js');
const { RenderConsole } = require('./RenderConsole.js');
const { Debugging, DEBUG } = require('./Debugging.js');
const { CharLength } = require('./CharLength.js');
const { CheckInput } = require('./CheckInput.js');
const { CleanInput } = require('./CleanInput.js');
const { GetOptions } = require('./GetOptions.js');
const { AlignText } = require('./AlignText.js');
const { Colorize } = require('./Colorize.js');
const { AddLine } = require('./AddLine.js');
const { AddChar } = require('./AddChar.js');
const { GetFont } = require('./GetFont.js');
const { CHARS } = require('./constants.js');
const { Color } = require('./Color.js');
const { Size } = require('./Size.js');
const { Log } = require('./Log.js');


/**
 * Main method to get the ANSI output for a string
 *
 * @param  {string}  input       - The string you want to write out
 * @param  {object}  SETTINGS    - Settings object
 * @param  {boolean} debug       - A flag to enable debug mode
 * @param  {integer} debuglevel  - The debug level we want to show
 * @param  {object}  size        - The size of the terminal as an object, default: Size
 * @param  {integer} size.width  - The width of the terminal
 * @param  {integer} size.height - The height of the terminal
 *
 * @typedef  {object} ReturnObject
 *   @property {string}  string  - The pure string for output with all line breaks
 *   @property {array}   array   - Each line of output in an array
 *   @property {integer} lines   - The number of lines
 *   @property {object}  options - All options used
 *
 * @return {ReturnObject}        - CLI output of INPUT to be consoled out
 */
const Render = ( input, SETTINGS = {}, debug = DEBUG.enabled, debuglevel = DEBUG.level, size = Size ) => {
	Debugging.report(`Running render`, 1);

	DEBUG.enabled = debug;
	DEBUG.level = debuglevel;

	const INPUT = CleanInput( input, CHARS );
	const OPTIONS = GetOptions( SETTINGS );

	let output = [];   // for output where each line is an output line
	let lines = 0;     // for counting each line
	let FONTFACE = {}; // scoping the fontface object higher for fonts with just one color

	const _isGoodHuman = CheckInput( INPUT, OPTIONS.font, OPTIONS.colors, OPTIONS.background, OPTIONS.align, OPTIONS.gradient );
	if( !_isGoodHuman.pass ) {
		Log.error( _isGoodHuman.message );

		return false;
	}


	// display an overview of options if debug flag is enabled
	if( DEBUG.enabled ) {
		let outOption = `OPTIONS:\n  Text: ${ INPUT }`;

		for( let key in OPTIONS ) {
			outOption += `\n  Options.${ key }: ${ OPTIONS[ key ] }`;
		}

		Debugging.report( outOption, 3 );
	}


	if( OPTIONS.font === 'console' ) { // console fontface is pretty easy to process
		FONTFACE = {
			colors: 1,
			lines: 1,
		};

		const consoleOutput = RenderConsole( INPUT, OPTIONS, size );

		output = consoleOutput.output;
		lines = consoleOutput.lines;
	}
	else { // all other fontfaces need the font-file and some more work
		FONTFACE = GetFont( OPTIONS.font );

		if( !FONTFACE ) {
			Log.error( `Font file for the font "${ OPTIONS.font }" could not be found.\nTry reinstalling this package.` );

			return false;
		}

		// setting the letterspacing preference from font face if there is no user overwrite
		if( SETTINGS.letterSpacing === undefined ) {
			Debugging.report( `Looking up letter spacing from font face`, 1 );

			let width = 0;

			FONTFACE.letterspace.forEach( item => {
				let char = item.replace( /(<([^>]+)>)/ig, '' ); // get character and strip color infos

				if( width < char.length ) {
					width = char.length;
				}
			});

			Debugging.report(`Letter spacing set to font face default: "${ width }"`, 2);
			OPTIONS.letterSpacing = width;
		}

		let lineLength = CharLength( FONTFACE.buffer, FONTFACE.lines, OPTIONS ); // count each output character per line and start with the buffer
		let maxChars = 0; // count each character we print for maxLength option

		output = AddLine( [], FONTFACE.lines, FONTFACE.buffer, OPTIONS.lineHeight ); // create first lines with buffer
		lines ++;

		output = AddLetterSpacing( output, FONTFACE.lines, FONTFACE.letterspace, FONTFACE.colors, OPTIONS.colors, OPTIONS.letterSpacing ); // add letter spacing to the beginning
		lineLength += CharLength( FONTFACE.letterspace, FONTFACE.lines, OPTIONS ) * OPTIONS.letterSpacing; // count the space for the letter spacing

		for( let i = 0; i < INPUT.length; i++ ) { // iterate through the message
			let CHAR = INPUT.charAt( i ).toUpperCase(); // the current character we convert, only upper case is supported at this time
			let lastLineLength = lineLength; // we need the lineLength for alignment before we look up if the next char fits

			Debugging.report(`Character found in font: "${ CHAR }"`, 2);

			if( CHAR !== `|` ) { // what will the line length be if we add the next char?
				lineLength += CharLength( FONTFACE.chars[ CHAR ], FONTFACE.lines, OPTIONS ); // get the length of this character
				lineLength += CharLength( FONTFACE.letterspace, FONTFACE.lines, OPTIONS ) * OPTIONS.letterSpacing; // new line, new line length
			}

			// jump to next line after OPTIONS.maxLength characters or when line break is found or the console windows would have ran out of space
			if( maxChars >= OPTIONS.maxLength && OPTIONS.maxLength != 0 || CHAR === `|` || lineLength > size.width ) {
				lines ++;

				Debugging.report(
					`NEWLINE: maxChars: ${ maxChars }, ` +
					`OPTIONS.maxLength: ${ OPTIONS.maxLength }, ` +
					`CHAR: ${ CHAR }, ` +
					`lineLength: ${ lineLength }, ` +
					`Size.width: ${ size.width } `, 2
				);

				output = AlignText( output, lastLineLength, FONTFACE.lines, OPTIONS.align, size ); // calculate alignment based on lineLength

				lineLength = CharLength( FONTFACE.buffer, FONTFACE.lines, OPTIONS ); // new line: new line length
				lineLength += CharLength( FONTFACE.letterspace, FONTFACE.lines, OPTIONS ) * OPTIONS.letterSpacing; // each new line starts with letter spacing

				if( CHAR !== `|` ) { // if this is a character and not a line break
					lineLength += CharLength( FONTFACE.chars[ CHAR ], FONTFACE.lines, OPTIONS ); // get the length of this character
					lineLength += CharLength( FONTFACE.letterspace, FONTFACE.lines, OPTIONS ) * OPTIONS.letterSpacing; // add letter spacing at the end
				}

				maxChars = 0; // new line, new maxLength goal

				output = AddLine( output, FONTFACE.lines, FONTFACE.buffer, OPTIONS.lineHeight ); // adding new line
				// add letter spacing to the beginning
				output = AddLetterSpacing( output, FONTFACE.lines, FONTFACE.letterspace, FONTFACE.colors, OPTIONS.colors, OPTIONS.letterSpacing );
			}

			Debugging.report(`lineLength at: "${ lineLength }"`, 2);

			if( CHAR !== `|` ) {
				maxChars++; // counting all printed characters
				output = AddChar( CHAR, output, FONTFACE.lines, FONTFACE.chars, FONTFACE.colors, OPTIONS.colors ); // add new character
				output = AddLetterSpacing( output, FONTFACE.lines, FONTFACE.letterspace, FONTFACE.colors, OPTIONS.colors, OPTIONS.letterSpacing );
			}
		}

		output = AlignText( output, lineLength, FONTFACE.lines, OPTIONS.align, size ); // alignment last line
	}

	let write = output.join(`\n`);


	if( FONTFACE.colors <= 1 ) {
		write = Colorize( write, FONTFACE.colors, OPTIONS.colors );
	}


	if( OPTIONS.space ) { // add space
		write = `\n\n${ write }\n\n`;
	}


	if( OPTIONS.background !== 'transparent' ) {
		const { open: openNew, close: closeNew } = Color( OPTIONS.background, true );

		write = openNew + '\n' + write + closeNew; // result in one string with background
	}


	return {
		string: write,
		array: output,
		lines: lines,
		options: OPTIONS,
	}
};


module.exports = exports = {
	Render,
};