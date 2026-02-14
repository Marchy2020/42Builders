"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const error = searchParams.get("error");

  useEffect(() => {
    async function checkAuth() {
      try {
        // Si un code OAuth est présent dans l'URL, le traiter
        const code = searchParams.get("code");
        if (code) {
          setIsLoading(true);
          try {
            // Appeler l'API pour traiter le code OAuth
            const res = await fetch("/api/auth/process", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ code }),
            });

            if (res.ok) {
              // Nettoyer l'URL et rediriger vers le dashboard
              router.replace("/dashboard");
              return;
            } else {
              const errorData = await res.json().catch(() => ({}));
              router.replace(`/?error=token_error`);
              return;
            }
          } catch (err) {
            console.error("Error processing OAuth code:", err);
            router.replace("/?error=token_error");
            return;
          }
        }

        const res = await fetch("/api/auth/check");
        const data = await res.json();
        if (data.authenticated) {
          router.push("/dashboard");
        }
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, [router, searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <Image
              src="/placeholder-logo.png"
              alt="42Builders Logo"
              width={128}
              height={128}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            42Builders
          </h1>
          <p className="text-muted-foreground">
            To build beyond localhost
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error === "no_code" && "Code d'autorisation manquant"}
              {error === "token_error" && "Erreur lors de l'authentification"}
              {!["no_code", "token_error"].includes(error) && `Erreur: ${error}`}
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-border bg-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-card-foreground">Connexion</CardTitle>
            <CardDescription>
              Connectez-vous avec votre compte 42 pour acceder aux events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" size="lg">
              <a href="/api/auth/login">
                <LogIn className="mr-2 h-5 w-5" />
                Se connecter avec 42
              </a>
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Vous devez avoir un compte 42 pour acceder a cette application
        </p>
      </div>
    </main>
  );
}
