"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createSupabaseBrowserClient } from "./supabase-browser";
import type { Clinic } from "@/types";

interface ClinicContextValue {
  clinic: Clinic | null;
  loading: boolean;
  error: string | null;
}

const ClinicContext = createContext<ClinicContextValue>({
  clinic: null,
  loading: true,
  error: null,
});

interface ClinicProviderProps {
  userEmail: string;
  children: ReactNode;
}

export function ClinicProvider({ userEmail, children }: ClinicProviderProps) {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClinic() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error: queryError } = await supabase
          .from("clinics")
          .select("*")
          .eq("owner_email", userEmail)
          .maybeSingle();

        if (queryError) {
          setError("No se pudo cargar la informacion de la clinica.");
          return;
        }

        setClinic(data);
      } catch {
        setError("Error de conexion. Intente nuevamente.");
      } finally {
        setLoading(false);
      }
    }

    if (userEmail) {
      fetchClinic();
    } else {
      setLoading(false);
    }
  }, [userEmail]);

  return (
    <ClinicContext.Provider value={{ clinic, loading, error }}>
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
