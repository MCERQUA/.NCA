import { StackProvider as StackFrameworkProvider, StackTheme, StackClientApp } from "@stackframe/stack";
import * as React from "react";

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
