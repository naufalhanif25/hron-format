import chalk from "chalk";
import { type HRONASTDocumentNode, type HRONASTKeyNode, type HRONASTValueNode, type HRONASTKeyValueNodeType } from "./builder";
import { type HRONValueType } from "./hron"

export type HRONKeysHierarchyType = { name: string; type: HRONASTKeyValueNodeType; level: number };
export type HRONValuesHierarchyType = { type: HRONASTKeyValueNodeType; value: HRONValueType; level: number };

export class HRONASTTranslator {
    constructor () {}

    // Checks if the key type expects a specific structure but the value type does not match
    private isTypeNotEqual = (keyType: HRONASTKeyValueNodeType, valueType: HRONASTKeyValueNodeType, targetType: HRONASTKeyValueNodeType): boolean => keyType === targetType && valueType !== targetType;
    
    // Returns true if the given type represents an HRON object
    private isObject = (input: HRONASTKeyValueNodeType): boolean => input === "Object";

    // Returns true if the given string is an object
    private isStringObject = (input: string): boolean => input.startsWith("{") && input.endsWith("}");
    
    // Returns true if the given type represents an HRON list
    private isList = (input: HRONASTKeyValueNodeType): boolean => input === "List";

    // Returns true if the given string is a list
    private isStringList = (input: string): boolean => input.startsWith("[") && input.endsWith("]");
    
    // Returns true if the type is either Object or List
    private isObjectList = (input: HRONASTKeyValueNodeType): boolean => this.isObject(input) || this.isList(input);
    
    // Extracts a flattened list from a tree-like AST structure
    private buildHierarchy<TNode, TResult>(roots: TNode[], initLevel: number, extractCallback: (node: TNode, level: number) => TResult, getChildrenCallback: (node: TNode) => TNode[] | undefined): TResult[] {
        const result: TResult[] = [];
        const walk = (node: TNode, level: number): void => {
            result.push(extractCallback(node, level));
            const children = getChildrenCallback(node);
            if (children) for (const child of children) walk(child, level + 1);
        };
        for (const root of roots) walk(root, initLevel);
        return result;
    }
    
    // Extracts and flattens key hierarchy from the AST
    private readonly getKeysHierarchy = (root: HRONASTKeyNode, initLevel: number = 1): HRONKeysHierarchyType[] => this.buildHierarchy([root], initLevel, (node, level) => ({ name: node.name, type: node.type, level }), (node) => node.children);
    
    // Extracts and flattens value hierarchy from the AST
    private readonly getValuesHierarchy = (root: HRONASTValueNode[], initLevel: number = 1): HRONValuesHierarchyType[] => this.buildHierarchy(root, initLevel, (node, level) => ({ type: node.type, value: node.value, level }), (node) => node.children);
    
    // Utility to remove outer brackets from a string
    private readonly sliceBracket = (input: string, openIndex: number = 1, closeIndex: number = input.length - 1) => input.slice(openIndex, closeIndex);

    // Reconstructs a JavaScript object from flattened HRON key and value hierarchies
    private buildObject = (keys: HRONKeysHierarchyType[], values: HRONValuesHierarchyType[]): any => {
        if (keys.length === 0) return {};
        let root: any = {};
        const keyStack: { level: number; node: any }[] = [{ level: 0, node: root }];
        const valueStack: { level: number; node: any }[] = [{ level: 0, node: root }];
        const keyLevels: Record<number, HRONKeysHierarchyType[]> = {};

        for (const key of keys) {
            const level = key.level;
            (keyLevels[level] ??= []).push(key);
        }
        const keyCursor: Record<number, number> = {};
        let valueIndex = 0;
        const valueLen = values.length;

        for (const key of keys) {
            const { name, type, level } = key;
            while (keyStack[keyStack.length - 1]!.level >= level) keyStack.pop();
            const parent = keyStack[keyStack.length - 1]!.node;
            const newNode = this.isObject(type) ? {} : this.isList(type) ? [] : null;

            if (Array.isArray(parent)) parent.push(newNode);
            else parent[name] = newNode;
            if (this.isObjectList(type)) keyStack.push({ level, node: newNode });

            while (valueIndex < valueLen && values[valueIndex]!.level <= level + 1) {
                const currentValue = values[valueIndex]!;
                const valueType = currentValue.type;
                const valueLevel = currentValue.level;
                while (valueStack[valueStack.length - 1]!.level >= valueLevel) valueStack.pop();
                if (!valueStack.length) throw new Error(`Invalid HRON structure: no parent available for value at level ${valueLevel}`);
                const valueParent = valueStack[valueStack.length - 1]!.node;
                const value = this.isObject(valueType) ? {} : this.isList(valueType) ? [] : currentValue.value;

                if (Array.isArray(valueParent)) {
                    valueParent.push(value);
                    if (this.isObjectList(valueType)) valueStack.push({ level: valueLevel, node: value });
                    valueIndex++;
                    continue;
                }
                const keysAtLevel = keyLevels[valueLevel] ?? [];
                const cursor = (keyCursor[valueLevel] ??= 0);
                const keyEntry = keysAtLevel[cursor];
                const keyType = keyEntry!.type;

                if (this.isTypeNotEqual(keyType, valueType, "List") || this.isTypeNotEqual(keyType, valueType, "Object")) throw new Error(`Type mismatch at level ${valueLevel}: key "${keyEntry?.name}" expects ${keyType}, but got ${valueType}`);
                if (keyEntry) {
                    valueParent[keyEntry.name] = value;
                    const nextCursor = cursor + 1;
                    keyCursor[valueLevel] = nextCursor >= keysAtLevel.length ? 0 : nextCursor;
                }
                if (this.isObjectList(valueType)) valueStack.push({ level: valueLevel, node: value });
                valueIndex++;
            }
        }
        if (valueIndex < valueLen) throw new Error(`Extra values detected: ${valueLen - valueIndex} values remain unused`);
        return root;
    };

    // Converts a JavaScript object into its HRON Key representation
    private objectToHRONKeys = (object: any, name?: string): string | undefined => {
        try {
            if (object === undefined) throw new Error(`Undefined: key '${name}' is undefined`);
            if (Array.isArray(object)) {
                const hronKeys = this.objectToHRONKeys(object[0]);
                return name ? `${chalk.yellow(name)}[${hronKeys}]` : `[${hronKeys}]`;
            }
            if (object !== null && typeof object === "object") {
                const keys = Object.keys(object).map(key => this.objectToHRONKeys(object[key], chalk.yellow(key))).join(",");
                return name ? `${chalk.yellow(name)}{${keys}}` : `{${keys}}`;
            }

            return name ?? "";
        }
        catch (error) { throw new Error(`Invalid HRON Keys on key '${name}'`) }
    };

    // Converts a JavaScript object into its HRON Value representation
    private objectToHRONValues = (object: any, indent: number = 2, level: number = 0): string | undefined => {
        try {
            if (object === undefined) throw new Error(`Undefined: values cannot be converted`);
            if (Array.isArray(object)) {
                if (object.length === 0) return "[]";
                const items = object.map(value => this.objectToHRONValues(value, indent, level + 1)).join(",");
                return this.isStringList(items) || indent < 1 ? `[${items}]` : `[\n${" ".repeat(indent * level)}${items}\n${" ".repeat(indent * (level - 1))}]`;
            }
            if (object !== null && typeof object === "object") {
                if (object.length === 0) return "{}";
                const values = Object.values(object).map(value => this.objectToHRONValues(value, indent, level + 1)).join(",");
                return this.isStringObject(values) || indent < 1 ? `{${values}}` : `{\n${" ".repeat(indent * level)}${values}\n${" ".repeat(indent * (level - 1))}}`;
            }
            if (typeof object === "string") return chalk.green(`'${object}'`);
            return chalk.magenta(String(object));
        }
        catch (error) { throw new Error(`Invalid HRON values`) }
    };

    // Converts an AST Document node into a JavaScript object
    public toObject = (document: HRONASTDocumentNode): any => {
        const keysHierarchy = this.getKeysHierarchy(document.children.header.children);
        const valuesHierarchy = this.getValuesHierarchy(document.children.body.children);
        return this.buildObject(keysHierarchy, valuesHierarchy);
    };

    // Converts a JavaScript object into a full HRON string
    public toHRON = (object: any, indent: number = 2): string => {
        const keys = this.objectToHRONKeys(object);
        const values = this.objectToHRONValues(object, indent);
        return `${this.sliceBracket(keys || "")}: ${this.sliceBracket(values || "")}`;
    };
}
