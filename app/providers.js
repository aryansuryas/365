'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { MotionConfig } from 'framer-motion';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <MotionConfig reducedMotion="user">
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </MotionConfig>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
