const { spawnSync } = require("node:child_process");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let filePath;
  try {
    const payload = JSON.parse(input);
    filePath = payload.tool_response?.filePath ?? payload.tool_input?.file_path;
  } catch {
    return;
  }
  if (!filePath) return;

  const ext = path.extname(filePath).toLowerCase();
  const prettierExts = [".tsx", ".ts", ".jsx", ".js", ".md", ".mdx", ".json", ".css"];
  const eslintExts = [".tsx", ".ts", ".jsx", ".js"];

  const binFor = (pkg, relPath) => {
    const pkgJson = require.resolve(`${pkg}/package.json`, { paths: [PROJECT_ROOT] });
    return path.join(path.dirname(pkgJson), relPath);
  };

  if (prettierExts.includes(ext)) {
    const prettierBin = binFor("prettier", "bin/prettier.cjs");
    spawnSync(process.execPath, [prettierBin, "--write", filePath], {
      cwd: PROJECT_ROOT,
      stdio: "ignore",
    });
  }
  if (eslintExts.includes(ext)) {
    const eslintBin = binFor("eslint", "bin/eslint.js");
    spawnSync(process.execPath, [eslintBin, "--fix", filePath], {
      cwd: PROJECT_ROOT,
      stdio: "ignore",
    });
  }
});
