import { HRON } from "../src/hron";
import { decode as toonDecode, encode as toonEncode } from "@toon-format/toon";
import data from "../public/example.json";
import chalk from "chalk";
import { YAML } from "bun";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

const getFileSize = (bytes: number, kilo: number = 1024, sizes: string[] = ["B", "KB", "MB"]): string => {
    const iter = Math.floor(Math.log(bytes) / Math.log(kilo));
    return `${chalk.yellow(parseFloat((bytes / Math.pow(kilo, iter)).toFixed(3)))} ${sizes[iter]}`;
};

const calcAverage = (data: number[]) => {
    const sum = data.reduce((a, b) => a + b, 0);
    return sum / data.length;
};

// HRON
const hron = new HRON();

// XML Parser & Builder
const xmlParser = new XMLParser();
const xmlBuilder = new XMLBuilder();

// Iteration count
const iter = 10;

// Load input files
const hronFile = Bun.file("public/example.hron");
const toonFile = Bun.file("public/example.toon");
const jsonFile = Bun.file("public/example.json");
const yamlFile = Bun.file("public/example.yml");
const xmlFile = Bun.file("public/example.xml");

const hronText = await hronFile.text();
const toonText = await toonFile.text();
const jsonText = await jsonFile.text();
const yamlText = await yamlFile.text();
const xmlText = await xmlFile.text();

// Decode Speed Test
console.log(chalk.bold.green(`[ Decode Speed (${iter} iterations) ]`));
console.log(chalk.gray("\u2500".repeat(35)));

const hronDecodeTime: number[] = [];
const toonDecodeTime: number[] = [];
const jsonDecodeTime: number[] = [];
const yamlDecodeTime: number[] = [];
const xmlDecodeTime: number[] = [];

for (let n = 0; n < iter; n++) {
    let startTime, endTime;

    // HRON
    startTime = performance.now();
    hron.parse(hronText);
    endTime = performance.now();
    hronDecodeTime.push(endTime - startTime);

    // TOON
    startTime = performance.now();
    toonDecode(toonText);
    endTime = performance.now();
    toonDecodeTime.push(endTime - startTime);

    // JSON
    startTime = performance.now();
    JSON.parse(jsonText);
    endTime = performance.now();
    jsonDecodeTime.push(endTime - startTime);

    // YAML
    startTime = performance.now();
    YAML.parse(yamlText);
    endTime = performance.now();
    yamlDecodeTime.push(endTime - startTime);

    // XML
    startTime = performance.now();
    xmlParser.parse(xmlText);
    endTime = performance.now();
    xmlDecodeTime.push(endTime - startTime);
}

console.log(`${chalk.bold("HRON :")}  ${chalk.yellow(calcAverage(hronDecodeTime).toFixed(3))} ms`);
console.log(`${chalk.bold("TOON :")}  ${chalk.yellow(calcAverage(toonDecodeTime).toFixed(3))} ms`);
console.log(`${chalk.bold("JSON :")}  ${chalk.yellow(calcAverage(jsonDecodeTime).toFixed(3))} ms`);
console.log(`${chalk.bold("YAML :")}  ${chalk.yellow(calcAverage(yamlDecodeTime).toFixed(3))} ms`);
console.log(`${chalk.bold("XML  :")}  ${chalk.yellow(calcAverage(xmlDecodeTime).toFixed(3))} ms\n`);

// Encode Speed Test
console.log(chalk.bold.green(`[ Encode Speed (${iter} iterations) ]`));
console.log(chalk.gray("\u2500".repeat(35)));

const hronEncodeTime: number[] = [];
const toonEncodeTime: number[] = [];
const jsonEncodeTime: number[] = [];
const yamlEncodeTime: number[] = [];
const xmlEncodeTime: number[] = [];

for (let n = 0; n < iter; n++) {
    let startTime, endTime;

    // HRON
    startTime = performance.now();
    hron.stringify(data);
    endTime = performance.now();
    hronEncodeTime.push(endTime - startTime);

    // TOON
    startTime = performance.now();
    toonEncode(data);
    endTime = performance.now();
    toonEncodeTime.push(endTime - startTime);

    // JSON
    startTime = performance.now();
    JSON.stringify(data);
    endTime = performance.now();
    jsonEncodeTime.push(endTime - startTime);

    // YAML
    startTime = performance.now();
    YAML.stringify(data);
    endTime = performance.now();
    yamlEncodeTime.push(endTime - startTime);

    // XML
    startTime = performance.now();
    xmlBuilder.build(data);
    endTime = performance.now();
    xmlEncodeTime.push(endTime - startTime);
}

console.log(`${chalk.bold("HRON :")}  ${chalk.yellow(calcAverage(hronEncodeTime).toFixed(3))} ms`);
console.log(`${chalk.bold("TOON :")}  ${chalk.yellow(calcAverage(toonEncodeTime).toFixed(3))} ms`);
console.log(`${chalk.bold("JSON :")}  ${chalk.yellow(calcAverage(jsonEncodeTime).toFixed(3))} ms`);
console.log(`${chalk.bold("YAML :")}  ${chalk.yellow(calcAverage(yamlEncodeTime).toFixed(3))} ms`);
console.log(`${chalk.bold("XML  :")}  ${chalk.yellow(calcAverage(xmlEncodeTime).toFixed(3))} ms\n`);

// File Size Report
console.log(chalk.bold.green("[ File Size ]"));
console.log(chalk.gray("\u2500".repeat(35)));

console.log(`${chalk.bold("HRON :")}  ${getFileSize(hronFile.size)}`);
console.log(`${chalk.bold("TOON :")}  ${getFileSize(toonFile.size)}`);
console.log(`${chalk.bold("JSON :")}  ${getFileSize(jsonFile.size)}`);
console.log(`${chalk.bold("YAML :")}  ${getFileSize(yamlFile.size)}`);
console.log(`${chalk.bold("XML  :")}  ${getFileSize(xmlFile.size)}`);
