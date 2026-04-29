const fs = require("fs")
const path = require("path")
const vm = require("vm")

const projectRoot = path.resolve(__dirname, "..")
const codeExtensions = new Set([".js", ".json"])
const assetExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".mp3", ".wav", ".aac", ".m4a", ".ogg"])
const ignoredDirectories = new Set([".git", "node_modules"])
const maxAssetBytes = 200 * 1024

const codeFiles = []
const assetFiles = []
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
      if (codeExtensions.has(extension)) {
        codeFiles.push(fullPath)
      } else if (assetExtensions.has(extension)) {
        assetFiles.push(fullPath)
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

function validateAssetSize(filePath) {
  const relativePath = path.relative(projectRoot, filePath)
  const size = fs.statSync(filePath).size

  if (size > maxAssetBytes) {
    hasFailure = true
    console.error("FAIL " + relativePath)
    console.error("Asset size " + size + " bytes exceeds limit " + maxAssetBytes + " bytes")
    return
  }

  console.log("OK   " + relativePath + " (" + size + " bytes)")
}

walk(projectRoot)
codeFiles.forEach(validateFile)
assetFiles.forEach(validateAssetSize)

if (hasFailure) {
  console.error("\nValidation failed.")
  process.exit(1)
}

console.log("\nValidated " + codeFiles.length + " code/json files and " + assetFiles.length + " assets successfully.")
