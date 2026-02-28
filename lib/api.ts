const DEFAULT_ENDPOINT = "https://pyxpay.com.br/v1";

export interface ApiConfig {
  apiKey: string;
  endpoint: string;
}

export class PyxPayClient {
  private apiKey: string;
  private endpoint: string;

  constructor(config: ApiConfig) {
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || DEFAULT_ENDPOINT;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.endpoint}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "api-key": this.apiKey,
        ...options.headers,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new ApiError(res.status, body?.message || res.statusText, body);
    }

    if (res.status === 204) return undefined as T;

    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return res.json();
    }
    return undefined as T;
  }

  // ── Carteira ──────────────────────────────────────────
  async getSaldo(): Promise<{ saldo: number }> {
    return this.request("/carteira/saldo");
  }

  async createCashout(data: CashoutRequest): Promise<TransacaoResponse> {
    return this.request("/carteira/cashout", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ── Cotacao ───────────────────────────────────────────
  async converterMoeda(valor: number): Promise<ValorConvertidoResponse> {
    return this.request("/cotacao/converter-moeda", {
      method: "POST",
      body: JSON.stringify({ valor }),
    });
  }

  async converterReal(valor: number): Promise<ValorConvertidoResponse> {
    return this.request("/cotacao/converter-real", {
      method: "POST",
      body: JSON.stringify({ valor }),
    });
  }

  // ── Transações ────────────────────────────────────────
  async createTransacaoPix(
    data: CreateTransacaoPixRequest
  ): Promise<TransacaoResponse> {
    return this.request("/transacao/pix", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createTransacaoBoleto(
    data: CreateTransacaoBoletoRequest
  ): Promise<TransacaoResponse> {
    return this.request("/transacao/boleto", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createTransacaoCartao(
    data: CreateTransacaoCartaoRequest
  ): Promise<{ link: string }> {
    return this.request("/transacao/cartao", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listTransacoes(
    params: ListTransacoesParams
  ): Promise<TransacaoListResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set("PeriodoInicio", params.periodoInicio);
    searchParams.set("PeriodoFim", params.periodoFim);
    if (params.pagina) searchParams.set("Pagina", String(params.pagina));
    if (params.registrosPorPagina)
      searchParams.set(
        "RegistrosPorPagina",
        String(params.registrosPorPagina)
      );
    if (params.status !== undefined)
      searchParams.set("Status", String(params.status));

    return this.request(`/transacao?${searchParams.toString()}`);
  }

  async getTransacao(identificador: number): Promise<TransacaoResponse> {
    return this.request(`/transacao/${identificador}`);
  }

  async reagendarPostback(identificador: number): Promise<void> {
    return this.request(`/transacao/${identificador}/postback`, {
      method: "PUT",
    });
  }
}

// ── Error ─────────────────────────────────────────────
export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

// ── Types ─────────────────────────────────────────────
export interface CashoutRequest {
  valor: number;
  nomeCliente: string;
  tipoChave: number;
  chave: string;
}

export interface CreateTransacaoPixRequest {
  valor: number;
  nome?: string;
  documento?: string;
  postbackUrl?: string;
  metadata?: string;
  vencimento?: string;
}

export interface CreateTransacaoBoletoRequest {
  valor: number;
  documento: string;
  nome?: string;
  vencimento?: string;
  postbackUrl?: string;
  metadata?: string;
}

export interface CreateTransacaoCartaoRequest {
  valor: number;
  phone?: string;
  postbackUrl?: string;
  metadata?: string;
}

export interface ListTransacoesParams {
  periodoInicio: string;
  periodoFim: string;
  pagina?: number;
  registrosPorPagina?: number;
  status?: number;
}

export interface HistoricoStatus {
  status: number;
  dataAtualizacao: string;
}

export interface TransacaoResponse {
  identidicador: number;
  nomeCliente: string | null;
  documentoCliente: string | null;
  dataCriacao: string | null;
  dataUltimaAlteracao: string | null;
  valorBruto: number;
  valorRecebivel: number;
  boletoCodigoDeBarra: string | null;
  boletoLinhaDigitavel: string | null;
  pixChavePagamento: string | null;
  hashId: string | null;
  estabelecimento: unknown;
  tipoOperacao: number;
  status: number;
  historicoStatus: HistoricoStatus[] | null;
  vencimento: string | null;
  isDebito: boolean;
  tipoChaveTransferenciaPix: string | null;
  chaveTransferenciaPix: string | null;
  nossaCotacao: number | null;
  valorConvertidoMoeda: number | null;
  usuario: { id: number; nome: string } | null;
}

export interface TransacaoListResponse {
  transacoes: TransacaoResponse[] | null;
  numeroDePaginas: number;
  numeroDeRegistros: number;
}

export interface ValorConvertidoResponse {
  valorOriginal: number;
  valorConvertido: number;
  moedaOrigem: string;
  moedaDestino: string;
  cotacao: number;
}

// ── Enums ─────────────────────────────────────────────
export const STATUS_TRANSACAO: Record<number, string> = {
  1: "Boleto Registrado",
  2: "Pago",
  3: "Boleto Liquidado/Compensado",
  4: "Cancelado",
  5: "Em Processo",
  6: "Autorizado",
  7: "Aguardando Pagamento",
  8: "Estornado",
  9: "Aguardando Estorno",
  10: "Recusado",
  11: "Devolvido",
  12: "Análise",
  13: "Revisão Pagamento",
  14: "Suspenso",
  15: "Em Disputa",
  16: "Transferido",
  17: "Não Pago",
  18: "Finalizado",
  19: "Confirmado",
  20: "Rejeitado",
};

export const STATUS_VARIANT: Record<number, string> = {
  1: "outline",
  2: "default",
  3: "default",
  4: "destructive",
  5: "secondary",
  6: "default",
  7: "outline",
  8: "destructive",
  9: "secondary",
  10: "destructive",
  11: "destructive",
  12: "secondary",
  13: "secondary",
  14: "destructive",
  15: "destructive",
  16: "default",
  17: "destructive",
  18: "default",
  19: "default",
  20: "destructive",
};

export const TIPO_OPERACAO: Record<number, string> = {
  1: "Boleto",
  2: "Cartão Débito",
  3: "Cartão Crédito",
  4: "Pix",
  5: "Depósito",
  6: "Juros",
  7: "Transferência Externa Pix",
  8: "Transferência Interna",
  9: "Pagamento Boleto",
  10: "Pagamento Pix",
  11: "Transferência Externa TED/TEV",
  12: "Depósito USDT",
  13: "Depósito Peso",
};

export const TIPO_CHAVE_TRANSFERENCIA: Record<number, string> = {
  1: "Telefone",
  2: "Email",
  3: "Documento",
  4: "Chave Aleatória",
};

export { DEFAULT_ENDPOINT as PYXPAY_DEFAULT_ENDPOINT };
