import pkg from "@stackframe/stack";
import * as React from "react";

// CommonJS module compatibility - destructure from default export
const { StackProvider: StackFrameworkProvider, StackTheme, StackClientApp } = pkg;

const stackApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/signin",
    afterSignIn: "/dashboard",
    afterSignUp: "/dashboard",
    afterSignOut: "/",
  },
});

export function StackProvider({ children }: { children: React.ReactNode }) {
  return (
    <StackFrameworkProvider app={stackApp}>
      <StackTheme>
        {children}
      </StackTheme>
    </StackFrameworkProvider>
  );
}
