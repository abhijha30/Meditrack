import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "./Spinner";

interface Props {
  children: React.ReactNode;
  role?: "patient" | "admin";  // if set, restricts to that role
}

export default function ProtectedRoute({ children, role }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (role && user.role !== role) {
        router.push(user.role === "admin" ? "/admin" : "/dashboard");
      }
    }
  }, [user, loading, role]);

  if (loading || !user) return <Spinner />;
  if (role && user.role !== role) return <Spinner />;

  return <>{children}</>;
}
