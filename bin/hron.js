#!/usr/bin/env node

import { spawn } from "child_process";
import { dirname, join } from "path";
import { platform } from "os";
import { fileURLToPath } from "url";
import { unlinkSync, existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// All existing binaries
const binaries = ["hron-linux", "hron-macos", "hron-win.exe"];

// Detect the current operating system
const os = platform();
let binary = null;

// Select the correct native binary based on OS
if (os === "linux") binary = "hron-linux";
else if (os === "darwin") binary = "hron-macos";
else if (os === "win32") binary = "hron-win.exe";
else {
    console.error(`Unsupported OS: ${os}`);
    binaries.forEach(file => {
        const path = join(__dirname, file);
        if (existsSync(path)) unlinkSync(path);
    });
    process.exit(1);
}

// Remove unused binaries
binaries.forEach(file => {
    if (file !== binary) {
        const path = join(__dirname, file);
        if (existsSync(path)) unlinkSync(path);
    }
});

// Build the full path to the platform-specific binary
const binPath = join(__dirname, binary);

// Spawn the binary and forward all CLI arguments + I/O
const proc = spawn(binPath, process.argv.slice(2), { stdio: "inherit" });

proc.on("exit", code => process.exit(code));
