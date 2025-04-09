
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createContext, useState, useContext } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/hooks/use-theme";

// Define version information type
export interface VersionInfo {
  version: string;
  label: string;
  description: string;
  features: string[];
  releaseDate: string;
}

// Create a context for the app version
export interface AppVersionContextType {
  version: string;
  setVersion: (version: string) => void;
  versionInfo: VersionInfo[];
  currentVersionInfo: VersionInfo;
}

// Define available versions with details
const appVersions: VersionInfo[] = [
  {
    version: "v1.0",
    label: "Version 1.0",
    description: "Initial Release",
    features: [
      "Basic loan calculator functionality",
      "EMI calculations for gold and personal loans",
      "Simple repayment schedule"
    ],
    releaseDate: "2024-01-15"
  },
  {
    version: "v2.0",
    label: "Version 2.0",
    description: "Advanced Loan Features",
    features: [
      "Interest rate change management",
      "Part payment options",
      "Enhanced repayment schedule",
      "Excel export functionality"
    ],
    releaseDate: "2024-03-10"
  },
  {
    version: "v2.1",
    label: "Version 2.1",
    description: "Part Payment Enhancements",
    features: [
      "Multiple part payment modes (single, multiple, recurring)",
      "Improved part payment UI",
      "Enhanced calculation engine"
    ],
    releaseDate: "2024-04-05"
  },
  {
    version: "v2.2",
    label: "Version 2.2",
    description: "UI & Theme Update",
    features: [
      "Dark/Light theme toggle",
      "Enhanced color scheme",
      "Improved visualization",
      "Responsive design improvements"
    ],
    releaseDate: "2024-04-09"
  }
];

export const AppVersionContext = createContext<AppVersionContextType>({
  version: "v2.2", // Default to latest version
  setVersion: () => {},
  versionInfo: appVersions,
  currentVersionInfo: appVersions[appVersions.length - 1]
});

export const useAppVersion = () => useContext(AppVersionContext);

const queryClient = new QueryClient();

const App = () => {
  const [version, setVersion] = useState<string>("v2.2"); // Latest version as default

  // Get current version info
  const currentVersionInfo = appVersions.find(v => v.version === version) || appVersions[appVersions.length - 1];

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <AppVersionContext.Provider value={{ 
          version, 
          setVersion, 
          versionInfo: appVersions,
          currentVersionInfo
        }}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppVersionContext.Provider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
