const moment = require('moment-timezone');

function isString(value) {
    return typeof value === 'string' || value instanceof String
}

/**
 * Confirms that the input is a string and that it is not longer than the length specified. If it is not a string a string conversion is attempted. If it is longer than the length specified it is truncated to that length.
 * @param {*} s The input value to check.
 * @param {*} len The length to check.
 * @returns A string value.
 */
const parseString = (s, len) => {
    if (isString(s) === false) {        
        try {
            s = s.toString();
        } catch (error) {       
            throw new Error(`The expected string value ${s} is not a string and failed a string conversion.`);
        }
    }
    return parseStringLength(s, len);
}

/**
 * Parses string values and returns a zero length string empty values.
 * @param {*} s The string to parse.
 * @returns The string returned.
 */
var parseStringValue = function (s) {

    //  if (isString(s) === false) {
    //     throw new Error(`A string input with value: ${s} is not a valid string.`);
    // }

    let length = s.length;
    if (length > 0 && s[0] === '"') {
        s = s.substring(1, s.length);
        length--;

        if (length > 0 && s[length - 1] === '"') {
            s = s.substring(0, s.length - 1);
        }
    }
    return (s === '(null)' ? '' : s.trim());
};

/**
 * Parses the length of a string and if it is greater than the length it is truncated to that length. 
 * @param {string} string The string to parse.
 * @param {number} length The length to check.
 * @returns The truncated string.
 */
function parseStringLength(string, length) {
    if (string.length > length) {
        return string.substring(0, length);
    }
    return string;
}



/** 
 *  returns a float value for a valid float or 0.0 otherwise
 */
var parseFloatValue = function (float) {
    var value = parseFloat(float);
    if(isNaN(value)){
        throw new Error(`A numeric input (cost, odometer or volume etc.) with value: ${float} is not a valid number (float).`);
    }
    return value;
};

function isEmpty(value) {
    return (value == null || value.length === 0);
}

/**
 * Parses the date format string submitted in the configuration file. e.g. YYYYMMDD or MM-DD-YYYY HH:mm:ss etc.
 * @param {String} format The format to parse
 * @returns An object containing a boolean (ReturnValue) indicating a good structure (true) or a poorly formatted date (false) and a reason (Problem) if the date is poorly formatted.
 */
function parseLuxonDateFormat(format, luxonDateParserMessages) {
    let output = {
        'ReturnValue': false,
        'Problem': ''
    };
    let regex = new RegExp('^(?=.*d)(?=.*M)(?=.*yy).*$');
    // Test1 - Must contain CAPITAL M, LOWER d and yy
    if (regex.test(format)) {
        // Contains - CAPITAL M, LOWER d and yy
    } else {
        output.ReturnValue = false;
        output.Problem = luxonDateParserMessages.condition1;
        // output.Problem = state.translate('Does not have a CAPITAL M and LOWER d and yy');
        return output;
    }

    // Test2 - If longer than 11 characters then must contain h and m (any case)
    if (format.length > 11) {
        regex = new RegExp('^(?=.*[H|h])(?=.*m).*$');
        if (regex.test(format)) {
            // Longer than 11 characters then must contain h and m = TRUE
        } else {
            output.ReturnValue = false;
            output.Problem = luxonDateParserMessages.condition2;
            // output.Problem = state.translate('Longer than 11 characters and does not contain h and m.');
            return output;
        }
    }
    // Test3 - Only characters allowed -  Y, M, D, h, m, s, S or Z
    regex = new RegExp('^[^abcefgijklnopqrtuvwxzABCEFGIJKLNOPQRUVWX]+$');
    if (regex.test(format)) {
        // Contains only allowed characters.
    } else {
        output.ReturnValue = false;
        output.Problem = luxonDateParserMessages.condition3;
        // output.Problem = state.translate('Contains disallowed characters other than Y, M, D, h, m, s, S or Z.');
        return output;
    }

    // Test4 - Min number of characters = 6
    if (format.length < 6) {
        output.ReturnValue = false;
        output.Problem = luxonDateParserMessages.condition4;
        // output.Problem = state.translate('Shorter than 6 characters.');
        return output;
    }
    // Test5 - Max number of characters = 24
    if (format.length > 24) {
        output.ReturnValue = false;
        output.Problem = luxonDateParserMessages.condition5;
        // output.Problem = state.translate('Greater than 24 characters.');
        return output;
    }

    // all rules satisfied so return true
    output.ReturnValue = true;
    return output;
}

/**
 * Gets the headings from the transaction data
 * @param {object} data The JSON configuration data object section.
 * @returns 
 */
function getHeadings(data) {
    var headRow = data[0];
    var isHeadingRow = true;
    Object.keys(headRow).forEach(function (columName) {
        if (!isNaN(parseInt(columName, 10))) {
            isHeadingRow = false;
        }
    });
    if (isHeadingRow) {
        return data.shift();
    }
    return [];
};

/**
 * todo: Not clear why this was in the existing release - add the documentation for this later if used.
 * @param {*} transactions An object containing the fuel transaction data (and error data which is irrelevant to this process).
 * @returns 
 */
var addBlanckColumn = function (transactions) {
    for (var i = 0; i < transactions.data.length; i++) {
        // get Headers object as master to compare, because header cannot 
        // be empty
        var keysHeader = Object.keys(transactions.data[0]);
        var keysTempTransaction = Object.keys(transactions.data[i]);

        var z = 0;
        var tempVar = z;
        for (z; z < keysHeader.length; z++) {
            // Compare the column header with the transaction column
            // if not match I add column with key equal to Header name
            // and value=null
            if (keysHeader[z] != keysTempTransaction[tempVar]) {
                transactions.data[i][keysHeader[z]] = '';
                keysTempTransaction = Object.keys(transactions.data[i]);
            }
            else { tempVar++; }
        }
    }
    return transactions;
};

/**
 * Gets the location coordinates from the transaction based on the configuration data settings.
 * @param {object} configuration The JSON configuration input.
 * @param {object} transaction The JSON transaction input.
 * @returns A JSON object containing the geographical location coordinates. X indicates longitude and y latitude. null is returned if no validate location data is found.
 */
function parseLocation(value) {
    let output = null;
    if (Array.isArray(value) && (value.length === 2)) {
        output = {
            'x': value[0],
            'y': value[1]
        }
    }
    return output;
}

module.exports = {
    parseStringValue,
    parseStringLength,
    parseFloatValue,
    getHeadings,
    addBlanckColumn,
    parseLuxonDateFormat,
    parseLocation,
    parseString
}