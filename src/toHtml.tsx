import { ReactNode } from "react";

// Export context to share data with Vite plugin
export interface ExportProps {
  children: ReactNode;
  filename?: string;
  to?: "link"; // Add support for link conversion
}

// This component doesn't render anything special, it just marks content
// that should be exported to a standalone HTML file
export function Export({ children, filename, to }: ExportProps) {
  return (
    <div data-export-html data-export-filename={filename} data-export-to={to}>
      {children}
    </div>
  );
}
