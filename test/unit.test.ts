import { test, expect } from "bun:test";
import data from "../public/example.json";
import { hron } from "../src/hron";

// test the parse method
test("Parse HRON string into JavaScript object", async () => {
    const file = Bun.file("public/example.hron");
    expect(typeof hron.parse(await file.text())).toBe("object");
});

// test the stringify method
test("Converts JavaScript object into HRON string", () => {
    expect(typeof hron.stringify(data)).toBe("string");
});