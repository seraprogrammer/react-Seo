import { Plugin, ResolvedConfig } from "vite";
import * as fs from "fs";
import * as path from "path";
import { parse } from "node-html-parser";

interface ExportInfo {
  filename: string;
  content: string;
  sourceFile: string;
  to?: string;
}

interface SeoOptions {
  sitemap?: {
    enable?: boolean;
    hostname?: string;
    changefreq?: string;
    priority?: string;
  };
  robots?: {
    enable?: boolean;
    rules?: Array<{
      userAgent: string;
      allow?: string[];
      disallow?: string[];
    }>;
  };
}

export default function htmlExport(options: SeoOptions = {}): Plugin {
  const exportComponents: ExportInfo[] = [];
  let config: ResolvedConfig;
  const generatedFiles: string[] = [];

  const defaultOptions: SeoOptions = {
    sitemap: {
      enable: true,
      hostname: "https://example.com",
      changefreq: "weekly",
      priority: "0.8",
    },
    robots: {
      enable: true,
      rules: [
        {
          userAgent: "*",
          allow: ["/"],
          disallow: ["/private/", "/admin/"],
        },
      ],
    },
  };

  // Merge with default options
  const seoOptions: SeoOptions = {
    sitemap: { ...defaultOptions.sitemap, ...options.sitemap },
    robots: { ...defaultOptions.robots, ...options.robots },
  };

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

                  // Extract 'to' attribute
                  const toMatch = attributes.match(/to=["']([^"']+)["']/);
                  const to = toMatch ? toMatch[1] : undefined;

                  console.log(
                    `Found Export in ${file} with filename ${filename}${
                      to ? ` and to=${to}` : ""
                    }`
                  );

                  // Store export info
                  exportComponents.push({
                    filename,
                    content,
                    sourceFile: file,
                    to,
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

          // Extract 'to' attribute
          const toMatch = attributes.match(/to=["']([^"']+)["']/);
          const to = toMatch ? toMatch[1] : undefined;

          console.log(
            `Transform: Found Export component in ${sourceFile} with filename: ${filename}${
              to ? ` and to=${to}` : ""
            }`
          );

          // Store the export info for later processing
          exportComponents.push({
            filename,
            content,
            sourceFile,
            to,
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

      const outDir = path.resolve(config.root, "dist");
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      if (exportComponents.length === 0) {
        console.log("No Export components found");

        // Fallback: directly create HTML files based on source files
        const srcDir = path.resolve(process.cwd(), "src");

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
                generatedFiles.push(`${baseFileName}.html`);
                console.log(
                  `Generated fallback ${baseFileName}.html from ${file}`
                );
              } catch (err) {
                console.error(`Error creating fallback HTML for ${file}:`, err);
              }
            }
          }
        }
      } else {
        // Process each export component
        for (const { filename, content, sourceFile, to } of exportComponents) {
          try {
            let processedContent = content;

            // Handle Link conversion if to="link" is specified
            if (to === "link") {
              console.log(`Converting Links to a tags for ${filename}.html`);

              // Convert <Link to="..."> to <a href="...">
              processedContent = processedContent.replace(
                /<Link\s+to=["']([^"']+)["'](.*?)>([\s\S]*?)<\/Link>/g,
                '<a href="$1"$2>$3</a>'
              );
            }

            // Clean up the content - try to preserve actual HTML but remove React-specific code
            const cleanedContent = processedContent
              .replace(/<SEO\s+metadata=\{[^}]+\}\s*\/?>.*?(?:<\/SEO>)?/g, "") // Remove SEO components
              .replace(/{/g, "<span data-placeholder>") // Replace JSX expressions with placeholders
              .replace(/}/g, "</span>") // Close the placeholder spans
              .replace(/\s+/g, " ") // Normalize whitespace
              .trim();

            // Parse the content as HTML
            const root = parse(`${cleanedContent}`);

            // Remove the placeholder spans
            const placeholders = root.querySelectorAll(
              "span[data-placeholder]"
            );
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
            generatedFiles.push(`${filename}.html`);
            console.log(
              `Generated ${filename}.html from ${sourceFile}${
                to ? ` with ${to} transformation` : ""
              }`
            );
          } catch (err) {
            console.error(`Error generating HTML for ${filename}:`, err);
          }
        }
      }

      // Generate robots.txt file
      if (seoOptions.robots?.enable) {
        try {
          const robotsPath = path.resolve(outDir, "robots.txt");
          let robotsContent = "";

          if (seoOptions.robots.rules && seoOptions.robots.rules.length > 0) {
            seoOptions.robots.rules.forEach((rule) => {
              robotsContent += `User-agent: ${rule.userAgent}\n`;

              if (rule.allow && rule.allow.length > 0) {
                rule.allow.forEach((path) => {
                  robotsContent += `Allow: ${path}\n`;
                });
              }

              if (rule.disallow && rule.disallow.length > 0) {
                rule.disallow.forEach((path) => {
                  robotsContent += `Disallow: ${path}\n`;
                });
              }

              robotsContent += "\n";
            });
          }

          // Add sitemap reference
          if (seoOptions.sitemap?.enable) {
            robotsContent += `Sitemap: ${seoOptions.sitemap.hostname}/sitemap.xml\n`;
          }

          fs.writeFileSync(robotsPath, robotsContent);
          console.log("Generated robots.txt");
        } catch (err) {
          console.error("Error generating robots.txt:", err);
        }
      }

      // Generate sitemap.xml
      if (seoOptions.sitemap?.enable && generatedFiles.length > 0) {
        try {
          const sitemapPath = path.resolve(outDir, "sitemap.xml");
          const hostname = seoOptions.sitemap.hostname || "https://example.com";
          const changefreq = seoOptions.sitemap.changefreq || "weekly";
          const priority = seoOptions.sitemap.priority || "0.8";
          const currentDate = new Date().toISOString().split("T")[0];

          let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

          // Add root URL
          sitemapContent += `  <url>
    <loc>${hostname}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>1.0</priority>
  </url>
`;

          // Add each generated HTML file
          generatedFiles.forEach((file) => {
            const urlPath = file === "index.html" ? "" : file;
            sitemapContent += `  <url>
    <loc>${hostname}/${urlPath}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
          });

          sitemapContent += "</urlset>";

          fs.writeFileSync(sitemapPath, sitemapContent);
          console.log("Generated sitemap.xml");
        } catch (err) {
          console.error("Error generating sitemap.xml:", err);
        }
      }
    },
  };
}
