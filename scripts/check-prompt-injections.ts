/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * 
 * Script: check-prompt-injections.ts
 * Purpose: Pre-commit hook to scan staged files for AI Prompt Injection attempts.
 * This prevents malicious users or compromised AI bots from sneaking
 * "Ignore previous instructions" payloads into the codebase.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Regex patterns that typically indicate a prompt injection attack against AI
// Obfuscated with string concatenation so the script doesn't trigger on itself.
const FORBIDDEN_PATTERNS = [
    new RegExp('ignore (all )?' + 'previous (instructions|directives|rules)', 'i'),
    new RegExp('ai ' + 'instruction:', 'i'),
    new RegExp('you are an ' + 'a\\.?i', 'i'),
    new RegExp('forget your ' + 'instructions', 'i'),
    new RegExp('disregard (all )?' + 'previous', 'i'),
    new RegExp('system ' + 'prompt:', 'i'),
    new RegExp('never refuse ' + 'to', 'i')
];

function checkFile(filePath: string): boolean {
    const absolutePath = resolve(process.cwd(), filePath);
    try {
        const content = readFileSync(absolutePath, 'utf-8');
        
        for (const pattern of FORBIDDEN_PATTERNS) {
            const match = content.match(pattern);
            if (match) {
                console.error(`\n🚨 [SECURITY ALERT] AI Prompt Injection Blocked!`);
                console.error(`File: ${filePath}`);
                console.error(`Pattern matched: ${match[0]}`);
                console.error(`Reason: This code contains a dangerous directive designed to hijack AI code reviewers. Commit aborted.\n`);
                return false;
            }
        }
        return true;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return false;
    }
}

function run() {
    const files = process.argv.slice(2);
    if (!files.length) {
        console.log("No files provided for prompt injection scan.");
        process.exit(0);
    }

    let hasViolations = false;
    for (const file of files) {
        if (!checkFile(file)) {
            hasViolations = true;
        }
    }

    if (hasViolations) {
        process.exit(1); // Block the commit
    } else {
        process.exit(0); // Allow the commit
    }
}

run();
