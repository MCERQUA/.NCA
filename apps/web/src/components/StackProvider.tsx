import * as StackFramework from "@stackframe/stack";
import * as React from "react";

// Use namespace import to handle dual ESM/CommonJS package
const StackProvider = (StackFramework as any).StackProvider;
const StackTheme = (StackFramework as any).StackTheme;
const StackClientApp = (StackFramework as any).StackClientApp;

const stackApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/signin",
    afterSignIn: "/dashboard",
    afterSignUp: "/dashboard",
    afterSignOut: "/",
  },
});

export function StackAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <StackProvider app={stackApp}>
      <StackTheme>
        {children}
      </StackTheme>
    </StackProvider>
  );
}
