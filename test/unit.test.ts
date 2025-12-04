import { test, expect } from "bun:test";
import data from "../public/example.json";
import { hron } from "../src/hron";

// test the parse method
test("Parse HRON string into JavaScript object", async () => {
    const file = Bun.file("public/example.hron");
    const result = hron.parse(await file.text());

    expect(typeof result).toBe("object");
    expect(JSON.stringify(data) === JSON.stringify(result)).toBe(true);
});

// test the stringify method
test("Converts JavaScript object into HRON string", async () => {
    const file = Bun.file("public/example.hron");
    const result = hron.stringify(data, { indent: 0, colorize: false });
    const removeWhitespave = (input: string): string => input.replace(/ /g, "").replace(/\n/g, "");

    expect(typeof result).toBe("string");
    expect(removeWhitespave(await file.text()) === removeWhitespave(result)).toBe(true);
});