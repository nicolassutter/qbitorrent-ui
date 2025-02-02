import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LucideLoaderCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  component: Login,
});
const authSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export default function Login() {
  const { login } = useAuth();

  return (
    <main className="">
      <form
        onSubmit={(event) => {
          event.preventDefault();

          const { username, password } = authSchema.parse(
            Object.fromEntries(new FormData(event.currentTarget).entries()),
          );

          login.mutateAsync({ username, password });
        }}
      >
        <Card className="w-full max-w-sm mx-auto">
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="w-full">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                className="w-full"
                placeholder="Username"
                name="username"
              />
            </div>

            <div className="w-full">
              <Label htmlFor="password">Password</Label>
              <Input type="password" id="password" name="password" />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">
              Login
              {login.isPending && (
                <LucideLoaderCircle className="animate-spin" />
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </main>
  );
}
