import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  return { user: user || {} };
}