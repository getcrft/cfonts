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
 * CharLength
 *   Return the max width of a character by looking at its longest line
 *
 **************************************************************************************************************************************************************/
'use strict';

var _require = require('./Debugging.js'),
    Debugging = _require.Debugging;
/**
 * Return the max width of a character by looking at its longest line
 *
 * @param  {array}   character     - The character array from the font face object
 * @param  {integer} fontLines     - The number of lines this font has per character
 * @param  {integer} letterSpacing - The user defined letter spacing
 *
 * @return {integer}               - The length of a longest line in a character
 */


var CharLength = function CharLength(character, fontLines, letterSpacing) {
  Debugging.report("Running CharLength", 1);
  var charWidth = 0;

  for (var i = 0; i < fontLines; i++) {
    var _char = character[i].replace(/(<([^>]+)>)/ig, ''); // get character and strip color infos


    if (_char.length > charWidth) {
      charWidth = _char.length; // assign only largest
    }
  }

  ;

  if (charWidth === 0 && letterSpacing > 0) {
    Debugging.report("CharLength: Adding space to letter spacing", 1);
    charWidth = 1;
  }

  return charWidth;
};

module.exports = exports = {
  CharLength: CharLength
};