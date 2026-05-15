import type { AppProps } from "next/app";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "@/index.css";

import { Layout } from "@/components/layout";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ExposureProvider } from "@/lib/exposure-context";
import { ThemeProvider } from "@/lib/theme-context";
import { Toaster } from "@/components/ui/toaster";

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnWindowFocus: false,
            enabled: typeof window !== "undefined",
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <ExposureProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </ExposureProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
