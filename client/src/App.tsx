import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/layout";
import { useStore } from "@/lib/mock-api";

import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import ShoppingList from "@/pages/shopping";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user } = useStore();
  
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  return <Component />;
}

function Router() {
  const { user } = useStore();

  return (
    <Layout>
      <Switch>
        <Route path="/auth">
          {user ? <Redirect to="/dashboard" /> : <AuthPage />}
        </Route>
        
        <Route path="/dashboard">
          <ProtectedRoute component={Dashboard} />
        </Route>
        
        <Route path="/shopping">
          <ProtectedRoute component={ShoppingList} />
        </Route>
        
        <Route path="/profile">
          <ProtectedRoute component={Profile} />
        </Route>

        <Route path="/">
          <Redirect to={user ? "/dashboard" : "/auth"} />
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
