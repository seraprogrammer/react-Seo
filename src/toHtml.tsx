import { ReactNode } from "react";

// Export context to share data with Vite plugin
export interface ExportProps {
  children: ReactNode;
  filename?: string;
}

// This component doesn't render anything special, it just marks content
// that should be exported to a standalone HTML file
export function Export({ children, filename }: ExportProps) {
  return (
    <div data-export-html data-export-filename={filename}>
      {children}
    </div>
  );
}
