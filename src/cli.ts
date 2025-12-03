import { hron } from "./hron";
import chalk from "chalk";
import data from "../package.json";

type HRONOption = {
    options: Set<string>,
    description?: string,
    action: () => void,
    example?: string[],
}

const NAME = "hron";
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

// Displays help and usage information for all available options
const showHelpMessage = (optionList: Record<string, HRONOption>): void => {
    console.log(`${chalk.bold.yellow("HRON")} is a structured text format focused on being readable, compact, and fast to parse. ${chalk.gray(`(${VERSION})`)}\n`);
    console.log(`${chalk.bold(`Usage: hron ${chalk.blue("[options] [args...]")}`)}\n`);
    console.log(chalk.bold("Options:"));

    for (const optionDetail of Object.values(optionList)) {
        console.log(`  ${chalk.blue(Array.from(optionDetail.options).join(chalk.white(", ")))}\t\t\t${optionDetail.description}`);

        if (optionDetail.example) {
            console.log(`\t\t\t\t${chalk.gray("\u2570\u2500")}${chalk.bold("Example:")} ${chalk.gray(optionDetail.example.join(chalk.white(", ")))}`);
        }
    }

    console.log(`\n${chalk.bold("Learn more about HRON:")}\t\t${chalk.yellow("https://github.com/naufalhanif25/hron-format.git")}`)
}

// Handles CLI arguments and runs the corresponding option action
const argHandler = (input?: string): void => {
    const argvs = process.argv.slice(2);
    const argv: string | undefined = argvs[0];
    const optionList: Record<string, HRONOption> = {
        help: {
            options: new Set(["-h", "--help"]),
            description: "Show help message",
            action: () => showHelpMessage(optionList),
            example: ["hron --help", "hron -h"],
        },
        version: {
            options: new Set(["-v", "--version"]),
            description: "Show program version information",
            action: () => console.log(`${chalk.bold(NAME)} ${chalk.yellow(VERSION)}`),
            example: ["hron --version", "hron -v"],
        },
        encode: {
            options: new Set(["-e", "--encode"]),
            description: "Encode JavaScript objects into HRON string",
            action: async () => {
                if (input) console.log(hron.stringify(JSON.parse(input), { indent: 2, colorize: false }));
                else {
                    const optArgs = argvs.slice(1);
                    if (optArgs.length < 2) showHelpMessage(optionList);
                    else {
                        await Bun.write(optArgs[1]!, hron.stringify(JSON.parse(await Bun.file(optArgs[0]!).text()), { indent: 2, colorize: false }));
                    }
                }
            },
            example: ["cat data.json | hron --encode", "hron --encode data.json data.hron"],
        },
        decode: {
            options: new Set(["-d", "--decode"]),
            description: "Decode HRON string into JavaScript objects",
            action: async () => {
                if (input) console.log(JSON.stringify(hron.parse(input), null, 2));
                else {
                    const optArgs = argvs.slice(1);
                    if (optArgs.length < 2) showHelpMessage(optionList);
                    else {
                        await Bun.write(optArgs[1]!, JSON.stringify(hron.parse(await Bun.file(optArgs[0]!).text()), null, 2));
                    }
                }
            },
            example: ["cat data.hron | hron --decode", "hron --decode data.hron data.json"],
        }
    }

    for (const optionDetail of Object.values(optionList)) {
        if (optionDetail.options.has(argv || "")) {
            optionDetail.action();
            return;
        }
    }

    showHelpMessage(optionList);
}

// Reads stdin and starts argument handling
argHandler(await readStdin());
