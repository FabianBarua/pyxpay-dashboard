import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  TransacaoResponse,
  ListTransacoesParams,
} from "@/lib/api";
import { listTransacoes, getTransacao } from "@/lib/actions/api";
import { useAuthStore } from "./auth";

interface TransacoesState {
  transacoes: TransacaoResponse[];
  numeroDePaginas: number;
  numeroDeRegistros: number;
  loading: boolean;
  error: string | null;
  selectedTransacao: TransacaoResponse | null;

  // filters
  periodoInicio: string;
  periodoFim: string;
  pagina: number;
  registrosPorPagina: number;
  statusFilter: number | undefined;

  // actions
  setFilters: (filters: Partial<Pick<TransacoesState, "periodoInicio" | "periodoFim" | "pagina" | "registrosPorPagina" | "statusFilter">>) => void;
  fetchTransacoes: () => Promise<void>;
  fetchTransacao: (id: number) => Promise<void>;
  clearSelection: () => void;
}

function toLocalISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function getDefaultDates() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  start.setHours(0, 0, 0, 0);
  now.setHours(23, 59, 59, 0);
  return {
    periodoInicio: toLocalISO(start),
    periodoFim: toLocalISO(now),
  };
}

const defaults = getDefaultDates();

export const useTransacoesStore = create<TransacoesState>()(
  persist(
    (set, get) => ({
      transacoes: [],
      numeroDePaginas: 0,
      numeroDeRegistros: 0,
      loading: false,
      error: null,
      selectedTransacao: null,

      periodoInicio: defaults.periodoInicio,
      periodoFim: defaults.periodoFim,
      pagina: 1,
      registrosPorPagina: 1000,
      statusFilter: undefined,

      setFilters: (filters) => set(filters),

      fetchTransacoes: async () => {
        const creds = useAuthStore.getState().getCredentials();
        if (!creds.apiKey) {
          set({ error: "No autenticado" });
          return;
        }

        const state = get();
        set({ loading: true, error: null });

        const params: ListTransacoesParams = {
          periodoInicio: state.periodoInicio,
          periodoFim: state.periodoFim,
          pagina: state.pagina,
          registrosPorPagina: state.registrosPorPagina,
          status: state.statusFilter,
        };
        const result = await listTransacoes(creds, params);
        if (result.success) {
          set({
            transacoes: result.data.transacoes || [],
            numeroDePaginas: result.data.numeroDePaginas,
            numeroDeRegistros: result.data.numeroDeRegistros,
            loading: false,
          });
        } else {
          set({ error: result.error, loading: false });
        }
      },

      fetchTransacao: async (id: number) => {
        const creds = useAuthStore.getState().getCredentials();
        if (!creds.apiKey) {
          set({ error: "No autenticado" });
          return;
        }

        set({ loading: true, error: null });

        const result = await getTransacao(creds, id);
        if (result.success) {
          set({ selectedTransacao: result.data, loading: false });
        } else {
          set({ error: result.error, loading: false });
        }
      },

      clearSelection: () => set({ selectedTransacao: null }),
    }),
    {
      name: "pyxpay-transacoes-filters",
      partialize: (state) => ({
        periodoInicio: state.periodoInicio,
        periodoFim: state.periodoFim,
        pagina: state.pagina,
        registrosPorPagina: state.registrosPorPagina,
        statusFilter: state.statusFilter,
      }),
    }
  )
);
