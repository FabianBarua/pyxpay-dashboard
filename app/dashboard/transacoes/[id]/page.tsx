"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { getTransacao } from "@/lib/actions/api";
import type { TransacaoResponse } from "@/lib/api";
import {
  STATUS_TRANSACAO,
  STATUS_VARIANT,
  TIPO_OPERACAO,
  TIPO_CHAVE_TRANSFERENCIA,
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IconArrowLeft, IconRefresh } from "@tabler/icons-react";
import { reagendarPostback } from "@/lib/actions/api";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(date));
}

function Row({
  label,
  value,
  badge,
  mono,
}: {
  label: string;
  value?: string;
  badge?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      {badge || (
        <span
          className={`text-sm text-right break-all ${mono ? "font-mono text-xs" : ""}`}
        >
          {value}
        </span>
      )}
    </div>
  );
}

export default function TransacaoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const getCredentials = useAuthStore((s) => s.getCredentials);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [transacao, setTransacao] = useState<TransacaoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postbackMsg, setPostbackMsg] = useState("");
  const [postbackLoading, setPostbackLoading] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      setError("ID inválido");
      setLoading(false);
      return;
    }

    const creds = getCredentials();
    if (!creds.apiKey) {
      setError("No autenticado");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    getTransacao(creds, id).then((result) => {
      if (result.success) {
        setTransacao(result.data);
      } else {
        setError(result.error);
      }
      setLoading(false);
    });
  }, [params.id, _hasHydrated, getCredentials]);

  const handleReagendarPostback = async () => {
    if (!transacao) return;
    setPostbackLoading(true);
    setPostbackMsg("");
    try {
      const creds = getCredentials();
      const result = await reagendarPostback(creds, transacao.identidicador);
      if (result.success) {
        setPostbackMsg("Postback reagendado con éxito");
      } else {
        setPostbackMsg(`Error: ${result.error}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error";
      setPostbackMsg(`Error: ${message}`);
    } finally {
      setPostbackLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <IconRefresh className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !transacao) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <IconArrowLeft className="size-4" />
          Volver
        </Button>
        <div className="rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error || "Transacción no encontrada"}
        </div>
      </div>
    );
  }

  const tipoChaveNum = transacao.tipoChaveTransferenciaPix
    ? parseInt(transacao.tipoChaveTransferenciaPix, 10)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <IconArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            Transacción #{transacao.identidicador}
          </h1>
          <p className="text-muted-foreground">Detalle de la transacción</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Info General */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="ID" value={String(transacao.identidicador)} />
            <Row label="Hash ID" value={transacao.hashId || "—"} />
            <Row
              label="Tipo"
              value={TIPO_OPERACAO[transacao.tipoOperacao] || String(transacao.tipoOperacao)}
            />
            <Row
              label="Status"
              badge={
                <Badge
                  variant={
                    (STATUS_VARIANT[transacao.status] as
                      | "default"
                      | "secondary"
                      | "destructive"
                      | "outline") || "outline"
                  }
                >
                  {STATUS_TRANSACAO[transacao.status] || transacao.status}
                </Badge>
              }
            />
            <Row label="Débito" value={transacao.isDebito ? "Sí" : "No"} />
            <Row label="Fecha Creación" value={formatDate(transacao.dataCriacao)} />
            <Row
              label="Última Actualización"
              value={formatDate(transacao.dataUltimaAlteracao)}
            />
            <Row
              label="Vencimiento"
              value={formatDate(transacao.vencimento)}
            />
          </CardContent>
        </Card>

        {/* Valores */}
        <Card>
          <CardHeader>
            <CardTitle>Valores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Valor Bruto" value={formatCurrency(transacao.valorBruto)} />
            <Row
              label="Valor Recibido"
              value={formatCurrency(transacao.valorRecebivel)}
            />
            {transacao.nossaCotacao && (
              <Row label="Cotización" value={String(transacao.nossaCotacao)} />
            )}
            {transacao.valorConvertidoMoeda && (
              <Row
                label="Valor Convertido"
                value={formatCurrency(transacao.valorConvertidoMoeda)}
              />
            )}
          </CardContent>
        </Card>

        {/* Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Nombre" value={transacao.nomeCliente || "—"} />
            <Row label="Documento" value={transacao.documentoCliente || "—"} />
            {transacao.usuario && (
              <>
                <Separator />
                <Row label="Usuario ID" value={String(transacao.usuario.id)} />
                <Row label="Usuario" value={transacao.usuario.nome || "—"} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Pago */}
        <Card>
          <CardHeader>
            <CardTitle>Datos de Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transacao.pixChavePagamento && (
              <Row label="Pix Copia Cola" value={transacao.pixChavePagamento} mono />
            )}
            {transacao.boletoLinhaDigitavel && (
              <Row
                label="Boleto Línea Digitável"
                value={transacao.boletoLinhaDigitavel}
                mono
              />
            )}
            {transacao.boletoCodigoDeBarra && (
              <Row
                label="Boleto Código de Barras"
                value={transacao.boletoCodigoDeBarra}
                mono
              />
            )}
            {transacao.chaveTransferenciaPix && (
              <>
                <Row
                  label="Tipo Clave Pix"
                  value={
                    tipoChaveNum
                      ? TIPO_CHAVE_TRANSFERENCIA[tipoChaveNum] || String(tipoChaveNum)
                      : transacao.tipoChaveTransferenciaPix || "—"
                  }
                />
                <Row
                  label="Clave Pix"
                  value={transacao.chaveTransferenciaPix}
                  mono
                />
              </>
            )}
            {!transacao.pixChavePagamento &&
              !transacao.boletoLinhaDigitavel &&
              !transacao.chaveTransferenciaPix && (
                <p className="text-muted-foreground text-sm">
                  Sin datos de pago disponibles
                </p>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Historial de status */}
      {transacao.historicoStatus && transacao.historicoStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transacao.historicoStatus.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                >
                  <Badge
                    variant={
                      (STATUS_VARIANT[h.status] as
                        | "default"
                        | "secondary"
                        | "destructive"
                        | "outline") || "outline"
                    }
                  >
                    {STATUS_TRANSACAO[h.status] || h.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(h.dataAtualizacao)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones</CardTitle>
          <CardDescription>
            Operaciones disponibles para esta transacción
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleReagendarPostback}
            disabled={postbackLoading}
          >
            <IconRefresh className="size-4" />
            {postbackLoading ? "Procesando..." : "Reagendar Postback"}
          </Button>
          {postbackMsg && (
            <span
              className={`text-sm ${
                postbackMsg.startsWith("Error")
                  ? "text-destructive"
                  : "text-green-600"
              }`}
            >
              {postbackMsg}
            </span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
