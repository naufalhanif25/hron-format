import { hron } from "./src/hron";

// HRON object
const file = Bun.file("public/example.hron");

// Parsing HRON into an JavaScript Object
console.log(hron.parse(await file.text()));