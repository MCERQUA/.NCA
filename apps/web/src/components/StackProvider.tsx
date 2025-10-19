import * as StackFramework from "@stackframe/stack";
import * as React from "react";

// Use namespace import to handle dual ESM/CommonJS package
const StackProvider = (StackFramework as any).StackProvider;
const StackTheme = (StackFramework as any).StackTheme;
const StackClientApp = (StackFramework as any).StackClientApp;

// Get environment variables - these are set in Netlify dashboard
const projectId = import.meta.env.PUBLIC_STACK_PROJECT_ID || '';
const publishableClientKey = import.meta.env.PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || '';

// Create Stack app instance with proper configuration
let stackApp: any = null;

if (projectId && publishableClientKey) {
  stackApp = new StackClientApp({
    projectId,
    publishableClientKey,
    tokenStore: "nextjs-cookie",
    urls: {
      signIn: "/signin",
      afterSignIn: "/dashboard",
      afterSignUp: "/dashboard",
      afterSignOut: "/",
    },
  });
}

export function StackAuthProvider({ children }: { children: React.ReactNode }) {
  // If Stack Auth is not configured, just render children without auth wrapper
  if (!stackApp) {
    return <>{children}</>;
  }

  return (
    <StackProvider app={stackApp}>
      <StackTheme>
        {children}
      </StackTheme>
    </StackProvider>
  );
}
