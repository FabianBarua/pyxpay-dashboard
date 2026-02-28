"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTransacoesStore } from "@/lib/store/transacoes";
import { useAuthStore } from "@/lib/store/auth";
import { STATUS_TRANSACAO, STATUS_VARIANT, TIPO_OPERACAO } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconRefresh,
  IconFilter,
  IconFilterOff,
  IconX,
  IconHash,
  IconColumns3,
  IconCalendar,
  IconExternalLink,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function toLocalISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

type ColumnKey = "id" | "tipo" | "cliente" | "documento" | "valor" | "recibido" | "status" | "fecha";

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "tipo", label: "Tipo" },
  { key: "cliente", label: "Cliente" },
  { key: "documento", label: "Documento" },
  { key: "valor", label: "Valor" },
  { key: "recibido", label: "Recibido" },
  { key: "status", label: "Status" },
  { key: "fecha", label: "Fecha" },
];

const DEFAULT_VISIBLE: ColumnKey[] = ["id", "tipo", "cliente", "documento", "valor", "recibido", "status", "fecha"];

const STORAGE_KEY = "pyxpay-visible-columns";

function loadVisibleCols(): ColumnKey[] {
  if (typeof window === "undefined") return DEFAULT_VISIBLE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      const valid = parsed.filter((k): k is ColumnKey =>
        ALL_COLUMNS.some((c) => c.key === k)
      );
      return valid.length > 0 ? valid : DEFAULT_VISIBLE;
    }
  } catch {}
  return DEFAULT_VISIBLE;
}

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

function toDateInputValue(isoString: string) {
  return new Date(isoString);
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  const near = new Set([1, 2, current - 1, current, current + 1, total - 1, total]);
  const sorted = [...near].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) pages.push("...");
    pages.push(sorted[i]);
  }
  return pages;
}

export default function TransacoesPage() {
  const {
    transacoes,
    numeroDePaginas,
    numeroDeRegistros,
    loading,
    error,
    pagina,
    periodoInicio,
    periodoFim,
    statusFilter,
    registrosPorPagina,
    setFilters,
    fetchTransacoes,
  } = useTransacoesStore();

  const router = useRouter();

  const [searchId, setSearchId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<number | undefined>(undefined);

  // Debounce client search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(clientSearch), 300);
    return () => clearTimeout(t);
  }, [clientSearch]);
  const [fechaInicio, setFechaInicio] = useState<Date>(() => toDateInputValue(periodoInicio));
  const [fechaFim, setFechaFim] = useState<Date>(() => toDateInputValue(periodoFim));
  const [calInicioOpen, setCalInicioOpen] = useState(false);
  const [calFimOpen, setCalFimOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [idDialogOpen, setIdDialogOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState<ColumnKey[]>(loadVisibleCols);

  const toggleCol = (key: ColumnKey) =>
    setVisibleCols((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  const isColVisible = (key: ColumnKey) => visibleCols.includes(key);
  const apiKey = useAuthStore((s) => s.apiKey);

  useEffect(() => {
    fetchTransacoes();
  }, [fetchTransacoes, apiKey]);

  const filteredTransacoes = useMemo(() => {
    let result = transacoes;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (tx) =>
          String(tx.identidicador).includes(q) ||
          (tx.nomeCliente && tx.nomeCliente.toLowerCase().includes(q)) ||
          (tx.documentoCliente && tx.documentoCliente.includes(q)) ||
          (tx.hashId && tx.hashId.toLowerCase().includes(q))
      );
    }
    if (tipoFilter !== undefined) {
      result = result.filter((tx) => tx.tipoOperacao === tipoFilter);
    }
    return result;
  }, [transacoes, debouncedSearch, tipoFilter]);

  const tableRows = useMemo(
    () =>
      filteredTransacoes.map((tx) => (
        <tr
          key={tx.identidicador}
          className="border-b last:border-0 hover:bg-muted/50 transition-colors"
        >
          {isColVisible("id") && (
            <td className="px-4 py-2.5 font-mono text-xs">{tx.identidicador}</td>
          )}
          {isColVisible("tipo") && (
            <td className="px-4 py-2.5 whitespace-nowrap text-xs">{TIPO_OPERACAO[tx.tipoOperacao] || tx.tipoOperacao}</td>
          )}
          {isColVisible("cliente") && (
            <td className="px-4 py-2.5 max-w-[140px] truncate">{tx.nomeCliente || "—"}</td>
          )}
          {isColVisible("documento") && (
            <td className="px-4 py-2.5 font-mono text-xs">{tx.documentoCliente || "—"}</td>
          )}
          {isColVisible("valor") && (
            <td className="px-4 py-2.5 font-medium whitespace-nowrap">{formatCurrency(tx.valorBruto)}</td>
          )}
          {isColVisible("recibido") && (
            <td className="px-4 py-2.5 whitespace-nowrap">{formatCurrency(tx.valorRecebivel)}</td>
          )}
          {isColVisible("status") && (
            <td className="px-4 py-2.5">
              <Badge
                variant={
                  (STATUS_VARIANT[tx.status] as
                    | "default"
                    | "secondary"
                    | "destructive"
                    | "outline") || "outline"
                }
              >
                {STATUS_TRANSACAO[tx.status] || tx.status}
              </Badge>
            </td>
          )}
          {isColVisible("fecha") && (
            <td className="px-4 py-2.5 whitespace-nowrap text-xs">{formatDate(tx.dataCriacao)}</td>
          )}
          <td className="px-2 py-2.5">
            <Link
              href={`/dashboard/transacoes/${tx.identidicador}`}
              className="inline-flex items-center justify-center size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Ver detalle"
            >
              <IconExternalLink className="size-4" />
            </Link>
          </td>
        </tr>
      )),
    [filteredTransacoes, visibleCols]
  );

  const hasClientFilters = debouncedSearch.trim() !== "" || tipoFilter !== undefined;

  // Count active server filters (non-default)
  const activeServerFilters = [
    statusFilter !== undefined,
  ].filter(Boolean).length;

  const handleSearchById = useCallback(() => {
    const trimmed = searchId.trim();
    if (!trimmed) return;
    const asNum = parseInt(trimmed, 10);
    if (!isNaN(asNum) && String(asNum) === trimmed) {
      // Numeric ID → navigate
      router.push(`/dashboard/transacoes/${asNum}`);
      setIdDialogOpen(false);
      setSearchId("");
    } else {
      // Hash ID → search locally then navigate
      const match = transacoes.find(
        (tx) => tx.hashId && tx.hashId.toLowerCase() === trimmed.toLowerCase()
      );
      if (match) {
        router.push(`/dashboard/transacoes/${match.identidicador}`);
        setIdDialogOpen(false);
        setSearchId("");
      }
    }
  }, [searchId, router, transacoes]);

  const handlePageChange = (newPage: number) => {
    setFilters({ pagina: newPage });
    setTimeout(() => fetchTransacoes(), 0);
  };

  const applyServerFilters = () => {
    setFilters({ pagina: 1 });
    fetchTransacoes();
    setFiltersOpen(false);
  };

  const clearAllFilters = () => {
    setClientSearch("");
    setTipoFilter(undefined);
    setFilters({ statusFilter: undefined });
    setFilters({ pagina: 1 });
    fetchTransacoes();
  };

  const pageNumbers = getPageNumbers(pagina, numeroDePaginas);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transacciones</h1>
          <p className="text-sm text-muted-foreground">
            {numeroDeRegistros} registros · Página {pagina}/{numeroDePaginas || 1}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchTransacoes()} disabled={loading}>
            <IconRefresh className={cn("size-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Compact toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar nombre, documento, ID o hash..."
            className="pl-9 h-9"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
          />
          {clientSearch && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setClientSearch("")}
            >
              <IconX className="size-3.5" />
            </button>
          )}
        </div>

        {/* Tipo select */}
        <Select
          value={tipoFilter !== undefined ? String(tipoFilter) : "all"}
          onValueChange={(v) => setTipoFilter(v === "all" ? undefined : parseInt(v, 10))}
        >
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(TIPO_OPERACAO).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Server filters dialog */}
        <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <IconFilter className="size-4" />
              Filtros
              {activeServerFilters > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                  {activeServerFilters}
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Filtros de búsqueda</DialogTitle>
              <DialogDescription>
                Configura los parámetros que se envían a la API
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Fecha Inicio</Label>
                  <Popover open={calInicioOpen} onOpenChange={setCalInicioOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between font-normal h-9 text-sm">
                        {format(fechaInicio, "dd/MM/yyyy")}
                        <IconCalendar className="size-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={fechaInicio}
                        defaultMonth={fechaInicio}
                        captionLayout="dropdown"
                        onSelect={(d) => {
                          if (d) {
                            setFechaInicio(d);
                            const local = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
                            setFilters({ periodoInicio: toLocalISO(local) });
                          }
                          setCalInicioOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha Fin</Label>
                  <Popover open={calFimOpen} onOpenChange={setCalFimOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between font-normal h-9 text-sm">
                        {format(fechaFim, "dd/MM/yyyy")}
                        <IconCalendar className="size-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={fechaFim}
                        defaultMonth={fechaFim}
                        captionLayout="dropdown"
                        onSelect={(d) => {
                          if (d) {
                            setFechaFim(d);
                            const local = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
                            setFilters({ periodoFim: toLocalISO(local) });
                          }
                          setCalFimOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={statusFilter !== undefined ? String(statusFilter) : "all"}
                  onValueChange={(v) =>
                    setFilters({
                      statusFilter: v === "all" ? undefined : parseInt(v, 10),
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(STATUS_TRANSACAO).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Registros por página</Label>
                <Select
                  value={String(registrosPorPagina)}
                  onValueChange={(v) =>
                    setFilters({ registrosPorPagina: parseInt(v, 10), pagina: 1 })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[50, 100, 500, 1000, 2000, 5000, 10000].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFiltersOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={applyServerFilters}>
                <IconRefresh className="size-4" />
                Aplicar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Search by ID dialog */}
        <Dialog open={idDialogOpen} onOpenChange={setIdDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <IconHash className="size-4" />
              ID
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Buscar por ID o Hash</DialogTitle>
              <DialogDescription>
                Ingresa el ID numérico o el Hash ID de la transacción
              </DialogDescription>
            </DialogHeader>
            <Input
              placeholder="Ej: 12345 o abc-def-123..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchById()}
              autoFocus
            />
            {searchId.trim() && isNaN(parseInt(searchId.trim(), 10)) && (
              <p className="text-xs text-muted-foreground">
                Buscará por Hash ID entre las transacciones cargadas
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIdDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSearchById} disabled={!searchId.trim()}>
                <IconSearch className="size-4" />
                Buscar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Column visibility */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <IconColumns3 className="size-4" />
              Columnas
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-2">
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Columnas visibles</p>
            {ALL_COLUMNS.map((col) => (
              <label
                key={col.key}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={isColVisible(col.key)}
                  onChange={() => toggleCol(col.key)}
                  className="size-3.5 accent-primary rounded"
                />
                {col.label}
              </label>
            ))}
          </PopoverContent>
        </Popover>

        {/* Clear all */}
        {(hasClientFilters || activeServerFilters > 0) && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <IconFilterOff className="size-4" />
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {(hasClientFilters || activeServerFilters > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {statusFilter !== undefined && (
            <Badge variant="secondary" className="gap-1 text-xs">
              Status: {STATUS_TRANSACAO[statusFilter]}
              <button onClick={() => { setFilters({ statusFilter: undefined, pagina: 1 }); fetchTransacoes(); }}>
                <IconX className="size-3" />
              </button>
            </Badge>
          )}
          {tipoFilter !== undefined && (
            <Badge variant="secondary" className="gap-1 text-xs">
              Tipo: {TIPO_OPERACAO[tipoFilter]}
              <button onClick={() => setTipoFilter(undefined)}>
                <IconX className="size-3" />
              </button>
            </Badge>
          )}
          {clientSearch.trim() && (
            <Badge variant="secondary" className="gap-1 text-xs">
              Buscar: &quot;{clientSearch}&quot;
              <button onClick={() => setClientSearch("")}>
                <IconX className="size-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-muted-foreground py-12 text-center">
              Cargando...
            </p>
          ) : filteredTransacoes.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center">
              {hasClientFilters
                ? "Sin resultados con los filtros actuales"
                : "No se encontraron transacciones"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground bg-muted/40">
                    {isColVisible("id") && <th className="px-4 py-2.5 font-medium">ID</th>}
                    {isColVisible("tipo") && <th className="px-4 py-2.5 font-medium">Tipo</th>}
                    {isColVisible("cliente") && <th className="px-4 py-2.5 font-medium">Cliente</th>}
                    {isColVisible("documento") && <th className="px-4 py-2.5 font-medium">Documento</th>}
                    {isColVisible("valor") && <th className="px-4 py-2.5 font-medium">Valor</th>}
                    {isColVisible("recibido") && <th className="px-4 py-2.5 font-medium">Recibido</th>}
                    {isColVisible("status") && <th className="px-4 py-2.5 font-medium">Status</th>}
                    {isColVisible("fecha") && <th className="px-4 py-2.5 font-medium">Fecha</th>}
                    <th className="w-10"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {numeroDePaginas > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Pág. {pagina}/{numeroDePaginas} · {numeroDeRegistros} registros
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={pagina <= 1}
                  onClick={() => handlePageChange(pagina - 1)}
                >
                  <IconChevronLeft className="size-4" />
                </Button>
                {pageNumbers.map((p, i) =>
                  p === "..." ? (
                    <span key={`d-${i}`} className="px-1 text-xs text-muted-foreground">
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === pagina ? "default" : "outline"}
                      size="icon-sm"
                      className={cn("min-w-8", p === pagina && "pointer-events-none")}
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={pagina >= numeroDePaginas}
                  onClick={() => handlePageChange(pagina + 1)}
                >
                  <IconChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
