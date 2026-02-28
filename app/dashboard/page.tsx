"use client";

import { useEffect } from "react";
import { useWalletStore } from "@/lib/store/wallet";
import { useTransacoesStore } from "@/lib/store/transacoes";
import { useAuthStore } from "@/lib/store/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_TRANSACAO, STATUS_VARIANT, TIPO_OPERACAO } from "@/lib/api";
import { IconWallet, IconArrowsExchange, IconReceipt } from "@tabler/icons-react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function DashboardPage() {
  const { saldo, loading: saldoLoading, fetchSaldo } = useWalletStore();
  const {
    transacoes,
    numeroDeRegistros,
    loading: txLoading,
    fetchTransacoes,
  } = useTransacoesStore();
  const apiKey = useAuthStore((s) => s.apiKey);

  useEffect(() => {
    fetchSaldo();
    fetchTransacoes();
  }, [fetchSaldo, fetchTransacoes, apiKey]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel de Control</h1>
        <p className="text-muted-foreground">
          Resumen de su cuenta Pyx Pay
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <IconWallet className="size-4" />
              Saldo Actual
            </CardDescription>
            <CardTitle className="text-2xl">
              {saldoLoading ? "Cargando..." : saldo !== null ? formatCurrency(saldo) : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <IconArrowsExchange className="size-4" />
              Transacciones (30 días)
            </CardDescription>
            <CardTitle className="text-2xl">
              {txLoading ? "Cargando..." : numeroDeRegistros}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <IconReceipt className="size-4" />
              Volumen Total
            </CardDescription>
            <CardTitle className="text-2xl">
              {txLoading
                ? "Cargando..."
                : formatCurrency(
                    transacoes.reduce((sum, t) => sum + t.valorBruto, 0)
                  )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Transacciones</CardTitle>
          <CardDescription>
            Las transacciones más recientes de los últimos 30 días
          </CardDescription>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <p className="text-muted-foreground py-8 text-center">
              Cargando transacciones...
            </p>
          ) : transacoes.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No hay transacciones en el período
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">ID</th>
                    <th className="pb-3 pr-4 font-medium">Tipo</th>
                    <th className="pb-3 pr-4 font-medium">Cliente</th>
                    <th className="pb-3 pr-4 font-medium">Valor</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {transacoes.slice(0, 10).map((tx) => (
                    <tr key={tx.identidicador} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-mono text-xs">
                        {tx.identidicador}
                      </td>
                      <td className="py-3 pr-4">
                        {TIPO_OPERACAO[tx.tipoOperacao] || tx.tipoOperacao}
                      </td>
                      <td className="py-3 pr-4">
                        {tx.nomeCliente || "—"}
                      </td>
                      <td className="py-3 pr-4 font-medium">
                        {formatCurrency(tx.valorBruto)}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={
                            (STATUS_VARIANT[tx.status] as "default" | "secondary" | "destructive" | "outline") ||
                            "outline"
                          }
                        >
                          {STATUS_TRANSACAO[tx.status] || tx.status}
                        </Badge>
                      </td>
                      <td className="py-3">{formatDate(tx.dataCriacao)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
