import { create } from "zustand";
import { getSaldo } from "@/lib/actions/api";
import { useAuthStore } from "./auth";

interface WalletState {
  saldo: number | null;
  loading: boolean;
  error: string | null;
  fetchSaldo: () => Promise<void>;
}

export const useWalletStore = create<WalletState>()((set) => ({
  saldo: null,
  loading: false,
  error: null,

  fetchSaldo: async () => {
    const creds = useAuthStore.getState().getCredentials();
    if (!creds.apiKey) {
      set({ error: "No autenticado" });
      return;
    }

    set({ loading: true, error: null });

    const result = await getSaldo(creds);
    if (result.success) {
      set({ saldo: result.data, loading: false });
    } else {
      set({ error: result.error, loading: false });
    }
  },
}));
