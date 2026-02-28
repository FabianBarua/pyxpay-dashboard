"use client";

import { useEffect } from "react";
import { useWalletStore } from "@/lib/store/wallet";
import { useAuthStore } from "@/lib/store/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconRefresh, IconWallet } from "@tabler/icons-react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function SaldoPage() {
  const { saldo, loading, error, fetchSaldo } = useWalletStore();
  const apiKey = useAuthStore((s) => s.apiKey);

  useEffect(() => {
    fetchSaldo();
  }, [fetchSaldo, apiKey]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Saldo</h1>
        <p className="text-muted-foreground">
          Consulte el saldo actual de su cuenta
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconWallet className="size-4" />
            Saldo Actual
          </CardDescription>
          <CardTitle className="text-4xl">
            {loading
              ? "Cargando..."
              : saldo !== null
              ? formatCurrency(saldo)
              : "—"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-destructive mb-3">{error}</p>
          )}
          <Button variant="outline" onClick={fetchSaldo} disabled={loading}>
            <IconRefresh className="size-4" />
            Actualizar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
