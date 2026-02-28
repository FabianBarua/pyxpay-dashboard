"use server";

import type {
  TransacaoResponse,
  TransacaoListResponse,
  ListTransacoesParams,
  CreateTransacaoPixRequest,
  CreateTransacaoBoletoRequest,
  CreateTransacaoCartaoRequest,
  CashoutRequest,
  ValorConvertidoResponse,
} from "@/lib/api";

// ── Result type (never throws, always returns) ──────────────────────

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ── Credentials ─────────────────────────────────────────────────────

export interface ApiCredentials {
  apiKey: string;
  endpoint: string;
}

// ── Internal fetch helper (runs on the server) ──────────────────────

async function apiRequest<T>(
  endpoint: string,
  apiKey: string,
  path: string,
  options: RequestInit = {}
): Promise<ActionResult<T>> {
  try {
    const url = `${endpoint}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
        ...options.headers,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const msg =
        body?.message ||
        body?.detail ||
        body?.title ||
        (body?.errors
          ? body.errors
              .map(
                (e: { field?: string; errorDescription?: string }) =>
                  e.errorDescription || e.field
              )
              .join(", ")
          : null) ||
        `Error ${res.status}: ${res.statusText}`;
      return { success: false, error: msg };
    }

    if (res.status === 204) return { success: true, data: undefined as T };

    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await res.json();
      return { success: true, data };
    }

    return { success: true, data: undefined as T };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error de conexión con la API";
    return { success: false, error: message };
  }
}

// ── Validate credentials ────────────────────────────────────────────

export async function validateCredentials(
  creds: ApiCredentials
): Promise<ActionResult<boolean>> {
  const result = await apiRequest<unknown>(
    creds.endpoint,
    creds.apiKey,
    "/carteira/saldo"
  );
  if (result.success) {
    return { success: true, data: true };
  }
  if (result.error.includes("401")) {
    return { success: false, error: "API Key inválida o sin autorización" };
  }
  // Even if saldo fails for other reasons, the key might be valid
  // but we show the error anyway
  return { success: false, error: result.error };
}

// ── Carteira ────────────────────────────────────────────────────────

export async function getSaldo(
  creds: ApiCredentials
): Promise<ActionResult<number>> {
  const result = await apiRequest<unknown>(
    creds.endpoint,
    creds.apiKey,
    "/carteira/saldo"
  );
  if (!result.success) return result;

  // Handle different possible response shapes
  const raw = result.data;
  let saldo: number;
  if (typeof raw === "number") {
    saldo = raw;
  } else if (raw && typeof raw === "object" && "saldo" in raw) {
    saldo = Number((raw as Record<string, unknown>).saldo);
  } else if (raw && typeof raw === "object" && "balance" in raw) {
    saldo = Number((raw as Record<string, unknown>).balance);
  } else {
    saldo = Number(raw);
  }

  return { success: true, data: isNaN(saldo) ? 0 : saldo };
}

export async function createCashout(
  creds: ApiCredentials,
  data: CashoutRequest
): Promise<ActionResult<TransacaoResponse>> {
  return apiRequest(creds.endpoint, creds.apiKey, "/carteira/cashout", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Cotação ─────────────────────────────────────────────────────────

export async function converterMoeda(
  creds: ApiCredentials,
  valor: number
): Promise<ActionResult<ValorConvertidoResponse>> {
  return apiRequest(creds.endpoint, creds.apiKey, "/cotacao/converter-moeda", {
    method: "POST",
    body: JSON.stringify({ valor }),
  });
}

export async function converterReal(
  creds: ApiCredentials,
  valor: number
): Promise<ActionResult<ValorConvertidoResponse>> {
  return apiRequest(creds.endpoint, creds.apiKey, "/cotacao/converter-real", {
    method: "POST",
    body: JSON.stringify({ valor }),
  });
}

// ── Transações ──────────────────────────────────────────────────────

export async function createTransacaoPix(
  creds: ApiCredentials,
  data: CreateTransacaoPixRequest
): Promise<ActionResult<TransacaoResponse>> {
  return apiRequest(creds.endpoint, creds.apiKey, "/transacao/pix", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createTransacaoBoleto(
  creds: ApiCredentials,
  data: CreateTransacaoBoletoRequest
): Promise<ActionResult<TransacaoResponse>> {
  return apiRequest(creds.endpoint, creds.apiKey, "/transacao/boleto", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createTransacaoCartao(
  creds: ApiCredentials,
  data: CreateTransacaoCartaoRequest
): Promise<ActionResult<{ link: string }>> {
  return apiRequest(creds.endpoint, creds.apiKey, "/transacao/cartao", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listTransacoes(
  creds: ApiCredentials,
  params: ListTransacoesParams
): Promise<ActionResult<TransacaoListResponse>> {
  const searchParams = new URLSearchParams();
  searchParams.set("PeriodoInicio", params.periodoInicio);
  searchParams.set("PeriodoFim", params.periodoFim);
  if (params.pagina) searchParams.set("Pagina", String(params.pagina));
  if (params.registrosPorPagina)
    searchParams.set("RegistrosPorPagina", String(params.registrosPorPagina));
  if (params.status !== undefined)
    searchParams.set("Status", String(params.status));

  return apiRequest(
    creds.endpoint,
    creds.apiKey,
    `/transacao?${searchParams.toString()}`
  );
}

export async function getTransacao(
  creds: ApiCredentials,
  identificador: number
): Promise<ActionResult<TransacaoResponse>> {
  return apiRequest(
    creds.endpoint,
    creds.apiKey,
    `/transacao/${identificador}`
  );
}

export async function reagendarPostback(
  creds: ApiCredentials,
  identificador: number
): Promise<ActionResult<void>> {
  return apiRequest(
    creds.endpoint,
    creds.apiKey,
    `/transacao/${identificador}/postback`,
    { method: "PUT" }
  );
}
