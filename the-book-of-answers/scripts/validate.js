#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const vm = require("vm")

const projectRoot = path.resolve(__dirname, "..")
const targetExtensions = new Set([".js", ".json"])
const ignoredDirectories = new Set([".git", "node_modules"])

const files = []
let hasFailure = false

function walk(directory) {
  fs.readdirSync(directory, { withFileTypes: true })
    .sort(function (a, b) {
      return a.name.localeCompare(b.name)
    })
    .forEach(function (entry) {
      const fullPath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) {
          walk(fullPath)
        }
        return
      }

      const extension = path.extname(entry.name)
      if (targetExtensions.has(extension)) {
        files.push(fullPath)
      }
    })
}

function validateJavaScript(filePath) {
  const source = fs.readFileSync(filePath, "utf8")
  new vm.Script(source, { filename: filePath })
}

function validateJson(filePath) {
  const source = fs.readFileSync(filePath, "utf8")
  JSON.parse(source)
}

function validateFile(filePath) {
  const relativePath = path.relative(projectRoot, filePath)
  const extension = path.extname(filePath)

  try {
    if (extension === ".js") {
      validateJavaScript(filePath)
    } else if (extension === ".json") {
      validateJson(filePath)
    }

    console.log("OK   " + relativePath)
  } catch (error) {
    hasFailure = true
    console.error("FAIL " + relativePath)
    console.error(String(error.message || error))
  }
}

walk(projectRoot)
files.forEach(validateFile)

if (hasFailure) {
  console.error("\nValidation failed.")
  process.exit(1)
}

console.log("\nValidated " + files.length + " files successfully.")
