import { StackProvider as StackFrameworkProvider, StackTheme } from "@stackframe/stack";
import * as React from "react";

const stackConfig = {
  projectId: import.meta.env.PUBLIC_STACK_PROJECT_ID || process.env.PUBLIC_STACK_PROJECT_ID || "",
  publishableClientKey: import.meta.env.PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || process.env.PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || "",
};

export function StackProvider({ children }: { children: React.ReactNode }) {
  return (
    <StackFrameworkProvider
      projectId={stackConfig.projectId}
      publishableClientKey={stackConfig.publishableClientKey}
      urls={{
        signIn: "/signin",
        afterSignIn: "/dashboard",
        afterSignUp: "/dashboard",
        afterSignOut: "/",
      }}
    >
      <StackTheme>
        {children}
      </StackTheme>
    </StackFrameworkProvider>
  );
}
