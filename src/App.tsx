
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
  },
  {
    version: "v3.0",
    label: "Version 3.0",
    description: "Advanced Input Controls",
    features: [
      "Precise date selection for interest rate changes",
      "Per-change EMI/tenure reduction options",
      "Direct value input without sliders",
      "Support for loans up to ₹100 crores",
      "Empty value support for flexible input"
    ],
    releaseDate: "2024-04-10"
  },
  {
    version: "v3.1",
    label: "Version 3.1",
    description: "Enhanced Experience & Performance",
    features: [
      "Performance optimizations",
      "Blank value support for interest rate changes",
      "Vibrant savings comparison visualization",
      "Dark mode color enhancements for better visibility",
      "Optimized calculations for faster rendering"
    ],
    releaseDate: "2024-04-11"
  }
];

export const AppVersionContext = createContext<AppVersionContextType>({
  version: "v3.1", // Default to latest version
  setVersion: () => {},
  versionInfo: appVersions,
  currentVersionInfo: appVersions[appVersions.length - 1]
});

export const useAppVersion = () => useContext(AppVersionContext);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Performance improvement
      staleTime: 300000, // 5 minutes
    },
  },
});

const App = () => {
  const [version, setVersion] = useState<string>("v3.1"); // Latest version as default

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
