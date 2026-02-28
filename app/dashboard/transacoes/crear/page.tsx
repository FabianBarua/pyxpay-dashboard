"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import {
  createTransacaoPix,
  createTransacaoBoleto,
  createTransacaoCartao,
} from "@/lib/actions/api";
import type {
  TransacaoResponse,
  CreateTransacaoPixRequest,
  CreateTransacaoBoletoRequest,
  CreateTransacaoCartaoRequest,
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { STATUS_TRANSACAO, STATUS_VARIANT, TIPO_OPERACAO } from "@/lib/api";
import { IconCopy } from "@tabler/icons-react";

type TipoTransacao = "pix" | "boleto" | "cartao";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function CrearTransacaoPage() {
  const getCredentials = useAuthStore((s) => s.getCredentials);

  const [tipo, setTipo] = useState<TipoTransacao>("pix");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TransacaoResponse | null>(null);
  const [linkResult, setLinkResult] = useState<string | null>(null);

  // Fields
  const [valor, setValor] = useState("");
  const [nome, setNome] = useState("");
  const [documento, setDocumento] = useState("");
  const [postbackUrl, setPostbackUrl] = useState("");
  const [metadata, setMetadata] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [phone, setPhone] = useState("");

  const resetForm = () => {
    setValor("");
    setNome("");
    setDocumento("");
    setPostbackUrl("");
    setMetadata("");
    setVencimento("");
    setPhone("");
    setError("");
    setResult(null);
    setLinkResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLinkResult(null);

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      setError("Valor debe ser un número positivo");
      return;
    }

    setLoading(true);
    const creds = getCredentials();

    try {
      if (tipo === "pix") {
        const data: CreateTransacaoPixRequest = {
          valor: valorNum,
          ...(nome && { nome }),
          ...(documento && { documento }),
          ...(postbackUrl && { postbackUrl }),
          ...(metadata && { metadata }),
          ...(vencimento && { vencimento: new Date(vencimento).toISOString() }),
        };
        const res = await createTransacaoPix(creds, data);
        if (!res.success) { setError(res.error); } else { setResult(res.data); }
      } else if (tipo === "boleto") {
        if (!documento) {
          setError("Documento es requerido para boleto");
          setLoading(false);
          return;
        }
        const data: CreateTransacaoBoletoRequest = {
          valor: valorNum,
          documento,
          ...(nome && { nome }),
          ...(postbackUrl && { postbackUrl }),
          ...(metadata && { metadata }),
          ...(vencimento && { vencimento: new Date(vencimento).toISOString() }),
        };
        const res = await createTransacaoBoleto(creds, data);
        if (!res.success) { setError(res.error); } else { setResult(res.data); }
      } else if (tipo === "cartao") {
        const data: CreateTransacaoCartaoRequest = {
          valor: valorNum,
          ...(phone && { phone }),
          ...(postbackUrl && { postbackUrl }),
          ...(metadata && { metadata }),
        };
        const res = await createTransacaoCartao(creds, data);
        if (!res.success) { setError(res.error); } else { setLinkResult(res.data.link); }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Crear Transacción</h1>
        <p className="text-muted-foreground">
          Cree una nueva transacción por Pix, Boleto o Tarjeta
        </p>
      </div>

      {/* Tipo selector */}
      <div className="flex gap-2">
        {(["pix", "boleto", "cartao"] as TipoTransacao[]).map((t) => (
          <Button
            key={t}
            variant={tipo === t ? "default" : "outline"}
            onClick={() => {
              setTipo(t);
              resetForm();
            }}
          >
            {t === "pix" ? "Pix" : t === "boleto" ? "Boleto" : "Tarjeta"}
          </Button>
        ))}
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            Nueva Transacción -{" "}
            {tipo === "pix" ? "Pix" : tipo === "boleto" ? "Boleto" : "Tarjeta"}
          </CardTitle>
          <CardDescription>
            Complete los datos para crear la transacción
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$) *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  required
                />
              </div>

              {tipo !== "cartao" && (
                <div className="space-y-2">
                  <Label htmlFor="nome">Nombre del Cliente</Label>
                  <Input
                    id="nome"
                    placeholder="Nombre completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
              )}

              {(tipo === "pix" || tipo === "boleto") && (
                <div className="space-y-2">
                  <Label htmlFor="documento">
                    Documento (CPF/CNPJ) {tipo === "boleto" ? "*" : ""}
                  </Label>
                  <Input
                    id="documento"
                    placeholder="CPF ou CNPJ"
                    maxLength={14}
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    required={tipo === "boleto"}
                  />
                </div>
              )}

              {tipo === "cartao" && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    placeholder="+5511999999999"
                    maxLength={13}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              )}

              {tipo !== "cartao" && (
                <div className="space-y-2">
                  <Label htmlFor="vencimento">Vencimiento</Label>
                  <Input
                    id="vencimento"
                    type="date"
                    value={vencimento}
                    onChange={(e) => setVencimento(e.target.value)}
                  />
                </div>
              )}
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="postbackUrl">Postback URL</Label>
                <Input
                  id="postbackUrl"
                  type="url"
                  placeholder="https://..."
                  value={postbackUrl}
                  onChange={(e) => setPostbackUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metadata">Metadata</Label>
                <Input
                  id="metadata"
                  placeholder="Datos adicionales (max 1000 chars)"
                  maxLength={1000}
                  value={metadata}
                  onChange={(e) => setMetadata(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Procesando..." : "Crear Transacción"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Result: Pix / Boleto */}
      {result && (
        <Card className="border-green-500/30">
          <CardHeader>
            <CardTitle className="text-green-600">
              Transacción Creada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="ID" value={String(result.identidicador)} />
            <Row
              label="Tipo"
              value={
                TIPO_OPERACAO[result.tipoOperacao] ||
                String(result.tipoOperacao)
              }
            />
            <Row
              label="Status"
              badge={
                <Badge
                  variant={
                    (STATUS_VARIANT[result.status] as
                      | "default"
                      | "secondary"
                      | "destructive"
                      | "outline") || "outline"
                  }
                >
                  {STATUS_TRANSACAO[result.status] || result.status}
                </Badge>
              }
            />
            <Row label="Valor" value={formatCurrency(result.valorBruto)} />
            {result.pixChavePagamento && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Pix Copia y Cola
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all rounded bg-muted p-2 text-xs">
                    {result.pixChavePagamento}
                  </code>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        result.pixChavePagamento || ""
                      )
                    }
                  >
                    <IconCopy className="size-4" />
                  </Button>
                </div>
              </div>
            )}
            {result.boletoLinhaDigitavel && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Línea Digitável
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all rounded bg-muted p-2 text-xs">
                    {result.boletoLinhaDigitavel}
                  </code>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        result.boletoLinhaDigitavel || ""
                      )
                    }
                  >
                    <IconCopy className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Result: Card link */}
      {linkResult && (
        <Card className="border-green-500/30">
          <CardHeader>
            <CardTitle className="text-green-600">
              Link de Pago Generado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded bg-muted p-2 text-xs">
                {linkResult}
              </code>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() =>
                  navigator.clipboard.writeText(linkResult || "")
                }
              >
                <IconCopy className="size-4" />
              </Button>
            </div>
            <Button
              variant="link"
              className="mt-2 px-0"
              onClick={() => window.open(linkResult, "_blank")}
            >
              Abrir link de pago →
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  badge,
}: {
  label: string;
  value?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      {badge || <span className="text-sm font-medium">{value}</span>}
    </div>
  );
}
