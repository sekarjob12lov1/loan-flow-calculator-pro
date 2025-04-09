
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createContext, useState, useContext } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Create a context for the app version
export interface AppVersionContextType {
  version: string;
  setVersion: (version: string) => void;
}

export const AppVersionContext = createContext<AppVersionContextType>({
  version: "v1.0",
  setVersion: () => {}
});

export const useAppVersion = () => useContext(AppVersionContext);

const queryClient = new QueryClient();

const App = () => {
  const [version, setVersion] = useState<string>("v1.0");

  return (
    <QueryClientProvider client={queryClient}>
      <AppVersionContext.Provider value={{ version, setVersion }}>
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
    </QueryClientProvider>
  );
};

export default App;
