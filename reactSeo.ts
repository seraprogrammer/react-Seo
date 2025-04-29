import { Plugin, ResolvedConfig } from "vite";
import * as fs from "fs";
import * as path from "path";
import { parse } from "node-html-parser";

interface ExportInfo {
  filename: string;
  content: string;
  sourceFile: string;
}

export default function htmlExport(): Plugin {
  const exportComponents: ExportInfo[] = [];
  let config: ResolvedConfig;

  return {
    name: "vite-plugin-html-export",

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    // Load all source files explicitly
    buildStart() {
      console.log("Build started, manually scanning for Export components");

      const srcDir = path.resolve(process.cwd(), "src");
      if (fs.existsSync(srcDir)) {
        const processDirectory = (dir: string) => {
          const files = fs.readdirSync(dir);

          for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
              processDirectory(filePath);
            } else if (file.endsWith(".tsx") || file.endsWith(".jsx")) {
              console.log(`Manually scanning ${filePath}`);

              try {
                const code = fs.readFileSync(filePath, "utf-8");
                const baseFileName = file.split(".")[0].toLowerCase();

                // Look for Export components
                const exportRegex =
                  /<Export(?:\s+([^>]*))?>([\s\S]*?)<\/Export>/g;
                let match;
                let found = false;

                while ((match = exportRegex.exec(code)) !== null) {
                  found = true;
                  const attributes = match[1] || "";
                  const content = match[2];

                  // Extract filename from attributes
                  const filenameMatch = attributes.match(
                    /filename=["']([^"']+)["']/
                  );
                  const filename = filenameMatch
                    ? filenameMatch[1]
                    : baseFileName;

                  console.log(
                    `Found Export in ${file} with filename ${filename}`
                  );

                  // Store export info
                  exportComponents.push({
                    filename,
                    content,
                    sourceFile: file,
                  });
                }

                if (!found) {
                  console.log(`No Export components found in ${file}`);
                  console.log(
                    `File content sample: ${code.substring(0, 200)}...`
                  );
                }
              } catch (err) {
                console.error(`Error reading or parsing ${filePath}:`, err);
              }
            }
          }
        };

        processDirectory(srcDir);
      }
    },

    // Capture Export components during the transform phase too
    transform(code, id) {
      // Only process React component files
      if (!id.endsWith(".tsx") && !id.endsWith(".jsx")) {
        return null;
      }

      console.log(`Transform: Scanning file: ${id}`);
      console.log(`Code sample: ${code.substring(0, 200)}...`);

      // Get the source file name to use as a default filename
      const sourceFile = path.basename(id);
      const baseFileName = sourceFile.split(".")[0].toLowerCase();

      try {
        // Look for the Export component
        const exportRegex = /<Export(?:\s+([^>]*))?>([\s\S]*?)<\/Export>/g;
        let match;
        let found = false;

        while ((match = exportRegex.exec(code)) !== null) {
          found = true;
          const attributes = match[1] || "";
          const content = match[2];

          // Extract filename from attributes
          const filenameMatch = attributes.match(/filename=["']([^"']+)["']/);
          const filename = filenameMatch ? filenameMatch[1] : baseFileName;

          console.log(
            `Transform: Found Export component in ${sourceFile} with filename: ${filename}`
          );

          // Store the export info for later processing
          exportComponents.push({
            filename,
            content,
            sourceFile,
          });
        }

        if (!found) {
          console.log(`Transform: No Export components found in ${sourceFile}`);
        }
      } catch (err) {
        console.error(`Error parsing Export in ${id}:`, err);
      }

      return null;
    },

    // Generate HTML files after the build is complete
    closeBundle() {
      console.log(
        `CloseBundle: Found ${exportComponents.length} Export components`
      );

      if (exportComponents.length === 0) {
        console.log("No Export components found");

        // Fallback: directly create HTML files based on source files
        const srcDir = path.resolve(process.cwd(), "src");
        const outDir = path.resolve(config.root, "dist");

        if (fs.existsSync(srcDir)) {
          const files = fs.readdirSync(srcDir);
          for (const file of files) {
            if (file.endsWith(".tsx") || file.endsWith(".jsx")) {
              try {
                // Get the base filename without extension
                const baseFileName = file.split(".")[0].toLowerCase();

                // Create a basic HTML file as a fallback
                const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${baseFileName}</title>
</head>
<body>
  <!-- Generated from ${file} -->
  <p>This is a fallback export. Add Export components to customize the content.</p>
</body>
</html>`;

                const outputPath = path.resolve(outDir, `${baseFileName}.html`);
                fs.writeFileSync(outputPath, htmlContent);
                console.log(
                  `Generated fallback ${baseFileName}.html from ${file}`
                );
              } catch (err) {
                console.error(`Error creating fallback HTML for ${file}:`, err);
              }
            }
          }
        }

        return;
      }

      // Get the output directory
      const outDir = path.resolve(config.root, "dist");
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      // Process each export component
      for (const { filename, content, sourceFile } of exportComponents) {
        try {
          // Clean up the content - try to preserve actual HTML but remove React-specific code
          const cleanedContent = content
            .replace(/{/g, "<span data-placeholder>") // Replace JSX expressions with placeholders
            .replace(/}/g, "</span>") // Close the placeholder spans
            .replace(/\s+/g, " ") // Normalize whitespace
            .trim();

          // Parse the content as HTML
          const root = parse(`${cleanedContent}`);

          // Remove the placeholder spans
          const placeholders = root.querySelectorAll("span[data-placeholder]");
          placeholders.forEach((el) => {
            el.remove();
          });

          // Create the final HTML file
          const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename}</title>
</head>
<body>
  ${root.innerHTML}
</body>
</html>`;

          // Write the file
          const outputPath = path.resolve(outDir, `${filename}.html`);
          fs.writeFileSync(outputPath, htmlContent);
          console.log(`Generated ${filename}.html from ${sourceFile}`);
        } catch (err) {
          console.error(`Error generating HTML for ${filename}:`, err);
        }
      }
    },
  };
}
