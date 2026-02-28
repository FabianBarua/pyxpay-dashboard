"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { createCashout } from "@/lib/actions/api";
import type { TransacaoResponse, CashoutRequest } from "@/lib/api";
import {
  STATUS_TRANSACAO,
  STATUS_VARIANT,
  TIPO_CHAVE_TRANSFERENCIA,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function CashoutPage() {
  const getCredentials = useAuthStore((s) => s.getCredentials);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TransacaoResponse | null>(null);

  const [valor, setValor] = useState("");
  const [nomeCliente, setNomeCliente] = useState("");
  const [tipoChave, setTipoChave] = useState(1);
  const [chave, setChave] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      setError("Valor debe ser un número positivo");
      return;
    }

    if (!nomeCliente.trim()) {
      setError("Nombre del cliente es requerido");
      return;
    }

    if (!chave.trim()) {
      setError("Clave Pix es requerida");
      return;
    }

    setLoading(true);
    const creds = getCredentials();

    try {
      const data: CashoutRequest = {
        valor: valorNum,
        nomeCliente: nomeCliente.trim(),
        tipoChave,
        chave: chave.trim(),
      };
      const res = await createCashout(creds, data);
      if (!res.success) {
        setError(res.error);
      } else {
        setResult(res.data);
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
        <h1 className="text-2xl font-bold">Transferencia (Cashout)</h1>
        <p className="text-muted-foreground">
          Realice una transferencia via Pix
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva Transferencia</CardTitle>
          <CardDescription>
            Complete los datos para realizar la transferencia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
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

            <div className="space-y-2">
              <Label htmlFor="nomeCliente">Nombre del Cliente *</Label>
              <Input
                id="nomeCliente"
                placeholder="Nombre completo"
                maxLength={100}
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoChave">Tipo de Clave *</Label>
              <Select
                value={String(tipoChave)}
                onValueChange={(v) => setTipoChave(parseInt(v, 10))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_CHAVE_TRANSFERENCIA).map(
                    ([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chave">Clave Pix *</Label>
              <Input
                id="chave"
                placeholder="Clave pix del destinatario"
                maxLength={50}
                value={chave}
                onChange={(e) => setChave(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Procesando..." : "Realizar Transferencia"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-green-500/30">
          <CardHeader>
            <CardTitle className="text-green-600">
              Transferencia Realizada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="ID" value={String(result.identidicador)} />
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
            <Row label="Cliente" value={result.nomeCliente || "—"} />
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
