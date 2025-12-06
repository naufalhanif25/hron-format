import { HRONASTBuilder, type HRONASTDocumentNode } from "./builder";
import { type HRONParseOptions } from "./translator";

export type HRONTokenType = "IDENT" | "NUMBER" | "STRING" | "BOOL" | "SYMBOL" | "NULL";
export type HRONValueType = string | number | boolean | null;
export type HRONToken = { type: HRONTokenType, value: HRONValueType };
export type HRONParseType = { tokens?: HRONToken[], document?: HRONASTDocumentNode, object?: any };

/**
 * Class representing an HRON parser and serializer.
 * Return a new HRON instance.
 * 
 * @class HRON
 */
export class HRON extends HRONASTBuilder {
    private validSymbols: Set<string> = new Set(["{", "}", "[", "]", ",", ".", ":"]);

    // Returns ASCII code of a character or value depending on input type
    private readonly inputSelector = (input: string | number, index: number): number => typeof input === "string" ? input.charCodeAt(index) : input;

    // Checks if the character is a valid alphabetic character or underscore
    private isLetter = (input: string | number, index: number = 0): boolean => {
        const char = this.inputSelector(input, index);
        return ((char >= 65 && char <= 90) || (char >= 97 && char <= 122) || char === 95);
    };

    // Checks for numeric characters including dot (decimal point)
    private isDigit = (input: string | number, index: number = 0): boolean => {
        const char = this.inputSelector(input, index);
        return (char >= 48 && char <= 57) || char === 46;
    };

    // Determines if a character is considered whitespace
    private isWhitespace = (input: string): boolean => input === " " || input === "\n" || input === "\t" || input === "\r";

    // Returns true if character is alphanumeric or underscore
    private isLetterDigit(input: string | number, index: number = 0): boolean {
        const char = this.inputSelector(input, index);
        return ((char >= 65 && char <= 90) || (char >= 97 && char <= 122) || (char >= 48 && char <= 57) || char === 95);
    };

    // Checks if a character is a quote character
    private isQuote = (input: string): boolean => input === "'" || input === "\"";

    // Determines if a string matches boolean literal
    private isBool = (input: string): boolean => input === "true" || input === "false";

    // Determines if a string matches null literal
    private isNull = (input: string): boolean => input === "null";

    // Checks if a character is a comment symbol
    private isComment = (input: string): boolean => input === "#";

    // Token creation helpers
    private readonly createSymbolToken = (value: string): HRONToken => ({ type: "SYMBOL", value });
    private readonly createStringToken = (value: string): HRONToken => ({ type: "STRING", value });
    private readonly createNumberToken = (value: number): HRONToken => ({ type: "NUMBER", value });
    private readonly createBoolToken = (value: boolean): HRONToken => ({ type: "BOOL", value });
    private readonly createNullToken = (value: null): HRONToken => ({ type: "NULL", value });
    private readonly createIdentToken = (value: string): HRONToken => ({ type: "IDENT", value });

    // Converts an input string into a list of tokens
    protected tokenize = (input: string): HRONToken[] => {
        const tokens: HRONToken[] = [];
        let position = 0;

        while (position < input.length) {
            const char = input[position]!;
            if (this.isWhitespace(char)) {
                position++;
                continue;
            }
            if (this.isComment(char)) {
                const newlineIndex = input.indexOf("\n", position);
                position = newlineIndex === -1 ? input.length : newlineIndex + 1;
                continue;
            }
            if (this.validSymbols.has(char)) {
                tokens.push(this.createSymbolToken(char));
                position++;
                continue;
            }
            if (this.isQuote(char)) {
                const start = position + 1;
                const end = input.indexOf(char, start);
                if (end === -1) throw new Error(`Unterminated string starting at position ${position}. Context: "${input.slice(position, position + 20)}..."`);
                tokens.push(this.createStringToken(input.slice(start, end)));
                position = end + 1;
                continue;
            }
            if (this.isDigit(char)) {
                let index = position;
                while (true) {
                    if (!this.isDigit(input, index)) break;
                    index++;
                }
                tokens.push(this.createNumberToken(Number(input.slice(position, index))));
                position = index;
                continue;
            }
            if (this.isLetter(char)) {
                let index = position;
                const start = index;
                while (index < input.length && this.isLetterDigit(input[index]!)) index++;
                const identString = input.slice(start, index);
                if (this.isBool(identString)) tokens.push(this.createBoolToken(identString === "true"));
                else {
                    if (this.isNull(identString)) tokens.push(this.createNullToken(null))
                    else tokens.push(this.createIdentToken(identString));
                }
                position = index;
                continue;
            }
            throw new Error(`Unexpected character '${char}' at position ${position}. Context: "...${input.slice(position - 5, position + 5)}..."`);
        }
        return tokens;
    };

    /**
     * Parses a HRON-formatted string into a JavaScript object.
     *
     * @example
     * const data = `data{users[{id,name,role,verified,hobbies[]}]}: {[{1,'Alice','admin',false,['sport','run','game']},{2,'Bob','user',false,['swim','travel','code']}]}`
     * console.log(hron.parse(data));
     * 
     * @param {string} input - The HRON string to parse.
     * @returns {HRONParseType|any} The parsed JavaScript object or full parse output.
     * @throws {Error} If tokenization, AST building, or translation fails due to invalid HRON syntax.
     */
    public parse = (input: string): HRONParseType | any => this.toObject(this.build(this.tokenize(input)));

    /**
     * Converts a JavaScript object into a HRON-formatted string.
     *
     * @example
     * const data = {data: {users: [{ id: 1, name: "Alice", role: "admin", verified: false, hobbies: [ "sport", "run", "game" ] },{ id: 2, name: "Bob", role: "user", verified: false, hobbies: [ "swim", "travel", "code" ] }]}}
     * console.log(hron.stringify(data));
     * 
     * @param {any} object - The JavaScript value to serialize into HRON format.
     * @param {HRONParseOptions} [options={ indent: 2, colorize: true }] - Formatting options such as indentation size and color output.
     * @returns {string} A valid HRON string representation of the provided object.
     * @throws {Error} If the object contains unsupported values or fails during HRON serialization.
     */
    public stringify = (object: any, options: HRONParseOptions = { indent: 2, colorize: true }): string => this.toHRON(object, options);
}

/**
 * Main HRON object instance.
 *
 * @const
 * @type {HRON}
 */
export const hron: HRON = new HRON();
