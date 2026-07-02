"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "./supabase-browser";
import type { Clinic } from "@/types";

interface ClinicContextValue {
  clinic: Clinic | null;
  loading: boolean;
  error: string | null;
  userEmail: string;
  refetch: () => Promise<void>;
}

const ClinicContext = createContext<ClinicContextValue>({
  clinic: null,
  loading: true,
  error: null,
  userEmail: "",
  refetch: async () => {},
});

interface ClinicProviderProps {
  userEmail: string;
  children: ReactNode;
}

export function ClinicProvider({ userEmail, children }: ClinicProviderProps) {
  const router = useRouter();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClinic = useCallback(async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const supabase = createSupabaseBrowserClient();
      const { data: membership, error: queryError } = await supabase
        .from("clinic_users")
        .select("clinic_id, clinics(*)")
        .limit(1)
        .maybeSingle();

      if (queryError) {
        setError("No se pudo cargar la informacion de la clinica.");
        return;
      }

      setClinic((membership?.clinics as unknown as Clinic) ?? null);
    } catch {
      setError("Error de conexion. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchClinic();
  }, [fetchClinic]);

  useEffect(() => {
    if (!loading && !clinic && !error) {
      router.replace("/onboarding");
    }
  }, [loading, clinic, error, router]);

  return (
    <ClinicContext.Provider value={{ clinic, loading, error, userEmail, refetch: fetchClinic }}>
      {children}
    </ClinicContext.Provider>
  );
}

/**
 * Hook to access the current clinic data for the logged-in user.
 */
export function useClinic() {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error("useClinic debe usarse dentro de un ClinicProvider");
  }
  return context;
}
