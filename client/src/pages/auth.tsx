import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStore } from "@/lib/mock-api";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@assets/generated_images/moody_culinary_ingredients_on_a_dark_stone_table.png";

// Simplified schema for auth
const authSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthForm = z.infer<typeof authSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register } = useStore();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = async (data: AuthForm) => {
    setIsLoading(true);
    try {
      if (isLogin) {
        await login(data.email);
      } else {
        await register(data.email);
      }
      setLocation("/dashboard");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-4">
              <Utensils className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-serif font-bold tracking-tight">
              {isLogin ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin 
                ? "Enter your credentials to access your kitchen workflow" 
                : "Join TheCookFlow and start organizing your meals"}
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="chef@example.com"
                {...form.register("email")}
                data-testid="input-email"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                {...form.register("password")}
                data-testid="input-password"
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base" 
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
              data-testid="button-toggle-auth"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>

      {/* Right: Hero Image */}
      <div className="hidden lg:block relative bg-muted overflow-hidden">
        {/* We'll use a gradient fallback until the image is generated, or just the image if available */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 z-10 mix-blend-multiply" />
        <img 
          src={heroImage}
          alt="Culinary Workflow"
          className="absolute inset-0 w-full h-full object-cover"
        />
         <div className="absolute inset-0 bg-zinc-900/10" />
      </div>
    </div>
  );
}
