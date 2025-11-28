import { HRONASTBuilder, type HRONASTDocumentNode } from "./builder";
import { HRONASTTranslator } from "./translator";

export type HRONTokenType = "IDENT" | "NUMBER" | "STRING" | "BOOL" | "SYMBOL" | "NULL";
export type HRONValueType = string | number | boolean | null;
export type HRONToken = { type: HRONTokenType, value: HRONValueType };
export type HRONParseType = { tokens?: HRONToken[], document?: HRONASTDocumentNode, object?: any };

export class HRON {
    private validSymbols: Set<string>;
    public builder: HRONASTBuilder;
    public translator: HRONASTTranslator;

    constructor () {
        this.validSymbols = new Set(["{", "}", "[", "]", ",", ".", ":"]);
        this.builder = new HRONASTBuilder();
        this.translator = new HRONASTTranslator();
    }

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

    // Check if the file extension is valid
    private isExtValid = (input: string): boolean => input.split(".")[1] === "hron";

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
            let char = input[position]!;
            if (this.isWhitespace(char)) {
                position++;
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
                let index = position, start = index;
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

    // Parses text input into tokens, AST, and/or object depending on selected options
    public parse = (input: string, options: string = "o"): HRONParseType | any => {
        const optionList = new Set(options.split(""));
        const outputs: HRONParseType = {};
        let tokens: HRONToken[] | null = this.tokenize(input);
        if (optionList.has("t")) outputs.tokens = tokens;

        let document: HRONASTDocumentNode | null = this.builder.build(tokens);
        tokens = null;
        if (optionList.has("d")) outputs.document = document;
        
        let object: any = this.translator.toObject(document);
        document = null
        if (optionList.has("o")) outputs.object = object;
        object = null;
        return outputs;
    };

    // Saves HRON data to a file
    public save = async (data: any, filePath: string, options?: { mode?: number, createPath?: boolean }): Promise<number> => {
        if (!this.isExtValid(filePath)) throw new Error("Invalid file extension: only '.hron' files are supported.");
        return await Bun.write(filePath, data, options);
    };

    // Loads a HRON file and parses it
    public open = async (filePath: string, options: string = "o", fileOptions?: BlobPropertyBag): Promise<HRONParseType> => {
        if (!this.isExtValid(filePath)) throw new Error("Invalid file extension: only '.hron' files are supported.");
        const file = Bun.file(filePath, fileOptions);
        const data = await file.text();
        return this.parse(data, options);
    };
}
