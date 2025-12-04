import { type HRONToken, type HRONValueType, type HRONTokenType } from "./hron";
import { HRONASTTranslator } from "./translator";

export type HRONASTDocumentNode = { type: "Document", children: { header: HRONASTHeaderBlockNode; body: HRONASTValueBlockNode } };
export type HRONASTHeaderBlockNode = { type: "KeyBlock", children: HRONASTKeyNode };
export type HRONASTKeyValueNodeType = "Object" | "List" | "String" | "Number" | "Boolean" | "Null";
export type HRONASTBracketType = "Object" | "List";
export type HRONASTKeyNode = { type: HRONASTKeyValueNodeType, name: string, children: HRONASTKeyNode[] };
export type HRONASTValueBlockNode = { type: "ValueBlock", children: HRONASTValueNode[] };
export type HRONASTValueNode = { type: HRONASTKeyValueNodeType, value: HRONValueType, children: HRONASTValueNode[] };

export class HRONASTBuilder extends HRONASTTranslator {
    private tokens: HRONToken[] = [];
    private position = 0;

    // Peeks the current token without consuming it
    private peek = (): HRONToken => this.tokens[this.position]!;

    // Returns the current token and advances the pointer
    private next = (): HRONToken => this.tokens[this.position++]!;

    // Checks whether more tokens are available
    private hasMoreTokens = (): boolean => this.position < this.tokens.length;

    // Resets internal state after parsing
    private reset = (): void => {
        this.tokens = [];
        this.position = 0;
    };

    // Creates a document AST node
    private readonly createDocumentNode = (header: HRONASTHeaderBlockNode, body: HRONASTValueBlockNode): HRONASTDocumentNode => ({ type: "Document", children: { header, body } });
    
    // Creates the header block node
    private readonly createHeaderBlockNode = (keyNode: HRONASTKeyNode): HRONASTHeaderBlockNode => ({ type: "KeyBlock", children: keyNode });
    
    // Creates the value block node
    private readonly createValueBlockNode = (items: HRONASTValueNode[]): HRONASTValueBlockNode => ({ type: "ValueBlock", children: items });
    
    // Creates a key node for the key structure tree
    private readonly createKeyNode = (type: HRONASTKeyValueNodeType, name: string, children: HRONASTKeyNode[] = []): HRONASTKeyNode => ({ type, name, children });
    
    // Creates a node for actual value representation
    private readonly createValueNode = (type: HRONASTKeyValueNodeType, value: HRONValueType, children: HRONASTValueNode[] = []): HRONASTValueNode => ({ type, value, children });
    
    // Checks whether a token matches a bracket symbol
    private isBracketToken = (tokenType: HRONTokenType, tokenValue: HRONValueType, bracketSymbol: string) => tokenType === "SYMBOL" && tokenValue === bracketSymbol;

    // Ensures the next token matches a required type or value
    protected expect = (type: string, value?: string): HRONToken => {
        if (!this.hasMoreTokens()) throw new Error(`Expected token '${type}${value ? `(${value})` : ""}' but reached end of input at position ${this.position}`);
        const token = this.next();
        if (token.type !== type) throw new Error(`Expected token type '${type}' but got '${token.type}' (value: '${token.value}') at position ${this.position - 1}`);
        if (value && token.value !== value) throw new Error(`Expected token value '${value}' but got '${token.value}' at position ${this.position - 1}`);
        return token;
    };

    // Reads items inside a bracket block until the end symbol is encountered
    private readBracketItems<T>(endSymbol: string, parseFunctionCallback: () => T, consumeStart: boolean): T[] {
        if (consumeStart) this.next();
        const items: T[] = [];
        let token = this.peek();
        while (token && !this.isBracketToken(token.type, token.value, endSymbol)) {
            items.push(parseFunctionCallback());
            if (this.peek()?.value === ",") this.next();
            token = this.peek();
        }
        this.expect("SYMBOL", endSymbol);
        return items;
    }

    // Parses the header (key structure) section
    protected parseHeaderBlock = (): HRONASTHeaderBlockNode => this.createHeaderBlockNode(this.parseKeyNode());

    // Parses key node children inside brackets
    private parseChildren = (endSymbol: string): HRONASTKeyNode[] => this.readBracketItems(endSymbol, () => this.parseKeyNode(), false);

    // Parses a value node wrapped in brackets
    private parseBracket = (endSymbol: string, nodeType: HRONASTBracketType): HRONASTValueNode => {
        const children = this.readBracketItems(endSymbol, () => this.parseValueNode(), true);
        return this.createValueNode(nodeType, "", children);
    };

    // Parses a bracket block as a value block
    private parseBracketBlock = (endSymbol: string, type: HRONASTBracketType): HRONASTValueBlockNode => {
        const children = this.readBracketItems(endSymbol, () => this.parseValueNode(), true);
        const node = this.createValueNode(type, "", children);
        return this.createValueBlockNode([node]);
    };

    // Parses a key node in the header structure
    protected parseKeyNode = (): HRONASTKeyNode => {
        const token = this.peek();
        if (!token) throw new Error("Unexpected end of input while parsing key");
        const { type: tokenType, value: tokenValue } = token;

        if (tokenType === "IDENT") {
            const name = String(this.next().value);
            const nextToken = this.peek();

            if (nextToken?.type === "SYMBOL") {
                switch (nextToken.value) {
                    case "{":
                        this.next();
                        return this.createKeyNode("Object", name, this.parseChildren("}"));
                    case "[":
                        this.next();
                        return this.createKeyNode("List", name, this.parseChildren("]"));
                }
            }
            return this.createKeyNode("String", name, []);
        }
        if (this.isBracketToken(tokenType, tokenValue, "{")) {
            this.next();
            return this.createKeyNode("Object", "", this.parseChildren("}"));
        }
        if (this.isBracketToken(tokenType, tokenValue, "[")) {
            this.next();
            return this.createKeyNode("List", "", this.parseChildren("]"));
        }
        throw new Error(`Unexpected token in parseKeyNode: type='${tokenType}', value='${tokenValue}', position=${this.position}`);
    };

    // Parses the value block section of the document
    protected parseValueBlock = (): HRONASTValueBlockNode => {
        const start = this.peek();
        if (!start) throw new Error(`Unexpected end of input at position ${this.position}`);
        const tokenValue = start.value;
        switch (tokenValue) {
            case "{":
                return this.parseBracketBlock("}", "Object");
            case "[":
                return this.parseBracketBlock("]", "List");
        }
        if (start.type === "STRING" || start.type === "NUMBER" || start.type === "BOOL") return this.createValueBlockNode([this.parseValueNode()]);
        throw new Error(`Unexpected token '${tokenValue}' (type='${start.type}') at start of value block at position ${this.position}`);
    };

    // Parses a single value node
    protected parseValueNode = (): HRONASTValueNode => {
        const token = this.peek();
        if (!token) throw new Error("Unexpected end of input while parsing value");
        const { type: tokenType, value: tokenValue } = token;
        if (this.isBracketToken(tokenType, tokenValue, "{")) return this.parseBracket("}", "Object");
        if (this.isBracketToken(tokenType, tokenValue, "[")) return this.parseBracket("]", "List");
        this.next();
        
        switch (tokenType) {
            case "STRING":
                return this.createValueNode("String", tokenValue, []);
            case "NUMBER":
                return this.createValueNode("Number", Number(tokenValue), []);
            case "BOOL":
                return this.createValueNode("Boolean", tokenValue === "true", []);
            case "NULL":
                return this.createValueNode("Null", null, []);
        }
        throw new Error(`Unexpected token '${tokenValue}' (type='${tokenType}') at position ${this.position - 1}`);
    };

    // Builds the entire AST structure from the list of tokens
    protected build = (tokens: HRONToken[]): HRONASTDocumentNode => {
        this.tokens = tokens;
        const header = this.parseHeaderBlock();
        this.expect("SYMBOL", ":");
        const body = this.parseValueBlock();
        this.reset();
        return this.createDocumentNode(header, body);
    };
}