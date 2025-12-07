import { hron } from "./hron";
import chalk from "chalk";
import { promises as fs } from "fs";
import Denque from "denque";
import data from "../package.json";

// Represents parsed CLI option data
type HRONOptionData = {
    name: string;
    value: any;
}

// Defines metadata and behavior for a single CLI option
type HRONOptionDetail = {
    options: Set<string>;
    description: string;
    default?: number | boolean | string;
    action: (param?: any) => void;
    example: string[];
    pending: boolean;
}

const NAME = data.name;
const VERSION = data.version;

// Reads piped stdin input and returns it as a string
const readStdin = async (): Promise<string | undefined> => {
    if (process.stdin.isTTY) return undefined;
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        process.stdin.on("data", (chunk) => chunks.push(chunk));
        process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        process.stdin.on("error", (err) => reject(err));
    });
}

// Parses CLI argument and returns name/value pair
const parseOption = (input: string): HRONOptionData => {
    const optionData = input.split("=");
    return { name: optionData[0]!, value: optionData[1] || null };
}

// Displays help and usage information for all available options
const showHelpMessage = (optionList: Record<string, HRONOptionDetail>): void => {
    console.log(`${chalk.bold.yellow("HRON")} is a structured text format focused on being readable, compact, and fast to parse. ${chalk.gray(`(${VERSION})`)}\n`);
    console.log(`${chalk.bold(`${chalk.underline("Usage")}: ${chalk.reset(NAME)} ${chalk.bold.cyan("[options] [args]")}`)}\n`);
    console.log(chalk.bold(`${chalk.underline("Options")}:`));
    for (const optionDetail of Object.values(optionList)) {
        console.log(`  ${chalk.cyan(Array.from(optionDetail.options).join(chalk.white(", ")))}\t\t\t${optionDetail.description}${optionDetail.default && " " + chalk.yellow(`(default is ${optionDetail.default})`)}`);
        if (optionDetail.example) console.log(`\t\t\t\t${chalk.gray("\u2570\u2500")}${chalk.bold("Example:")} ${chalk.gray(optionDetail.example.join(chalk.white(", ")))}`);
    }
    console.log(`\n${chalk.bold("Learn more about HRON:")}\t\t${chalk.yellow(data.repository.url)}`)
}

// Handles CLI arguments and runs the corresponding option action
const argHandler = (input?: string): void => {
    const argValues = process.argv.slice(2);
    const actionLoop = new Denque<() => void>();
    const argList: string[] = [];

    let indent = 2;
    let colorize = false;

    const optionList: Record<string, HRONOptionDetail> = {
        help: {
            options: new Set(["-h", "--help"]),
            description: "Show help message",
            action: () => showHelpMessage(optionList),
            example: [`${NAME} --help`, `${NAME} -h`],
            pending: true,
        },
        version: {
            options: new Set(["-v", "--version"]),
            description: "Show program version information",
            action: () => console.log(`${chalk.bold(NAME)} ${chalk.yellow(VERSION)}`),
            example: [`${NAME} --version`, `${NAME} -v`],
            pending: true,
        },
        encode: {
            options: new Set(["-e", "--encode"]),
            description: "Encode JavaScript objects into HRON string",
            action: async () => {
                if (input) console.log(hron.stringify(JSON.parse(input), { indent, colorize }));
                else {
                    if (argList.length < 2) showHelpMessage(optionList);
                    else await fs.writeFile(argList[1]!, hron.stringify(JSON.parse(await fs.readFile(argList[0]!, "utf-8")), { indent, colorize: false }));
                }
            },
            example: [`cat data.json | ${NAME} --encode`, `${NAME} --encode data.json data.hron`],
            pending: true,
        },
        decode: {
            options: new Set(["-d", "--decode"]),
            description: "Decode HRON string into JavaScript objects",
            action: async () => {
                if (input) console.log(JSON.stringify(hron.parse(input), null, indent));
                else {
                    if (argList.length < 2) showHelpMessage(optionList);
                    else await fs.writeFile(argList[1]!, JSON.stringify(hron.parse(await fs.readFile(argList[0]!, "utf-8")), null, indent));
                }
            },
            example: [`cat data.hron | ${NAME} --decode`, `${NAME} --decode data.hron data.json`],
            pending: true,
        },
        indent: {
            options: new Set(["--indent"]),
            description: "Set indentation size",
            default: 2,
            action: (data?: HRONOptionData) => {
                if (data?.value) indent = parseInt(data.value) || indent;
            },
            example: [`cat data.hron | ${NAME} --decode --indent=4`, `${NAME} --decode data.hron data.json --indent=4`],
            pending: false,
        },
        colorize: {
            options: new Set(["--colorize"]),
            description: "Colorize output HRON string",
            action: () => colorize = true,
            example: [`cat data.hron | ${NAME} --decode --colorize`],
            pending: false,
        }
    }
    for (const option of argValues) {
        if (option.startsWith("-")) {
            const optionData: HRONOptionData = parseOption(option);
            for (const optionDetail of Object.values(optionList)) {
                if (optionDetail.options.has(optionData.name)) {
                    if (optionDetail.pending) actionLoop.push(() => optionDetail.action(optionData));
                    else optionDetail.action(optionData);
                }
            }
        }
        else argList.push(option);
    }
    if (actionLoop.length === 0) actionLoop.push(() => showHelpMessage(optionList));
    for (const action of actionLoop.toArray()) action();
}

// Reads stdin and starts argument handling
(async () => argHandler(await readStdin()))();