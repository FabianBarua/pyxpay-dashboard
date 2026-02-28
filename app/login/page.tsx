"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { useSavedKeysStore, type SavedApiKey } from "@/lib/store/saved-keys";
import { validateCredentials } from "@/lib/actions/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  IconKey,
  IconTrash,
  IconDeviceFloppy,
  IconLogin,
  IconPencil,
  IconPlus,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const DEFAULT_ENDPOINT = "https://pyxpay.com.br/v1";

function maskKey(key: string) {
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 4) + "••••" + key.slice(-4);
}

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const { keys, addKey, removeKey, updateKey } = useSavedKeysStore();

  const [apiKey, setApiKey] = useState("");
  const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINT);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Save dialog
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");

  // Edit dialog
  const [editKey, setEditKey] = useState<SavedApiKey | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editApiKey, setEditApiKey] = useState("");
  const [editEndpoint, setEditEndpoint] = useState("");
  const [showEditKey, setShowEditKey] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Hydration guard
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!apiKey.trim()) {
      setError("API Key es requerida");
      return;
    }

    setLoading(true);

    try {
      const ep = endpoint.trim() || DEFAULT_ENDPOINT;
      const result = await validateCredentials({ apiKey: apiKey.trim(), endpoint: ep });

      if (!result.success) {
        setError(result.error);
        return;
      }

      login(apiKey.trim(), ep);
      router.push("/dashboard");
    } catch {
      setError("Error al conectar con la API");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (saved: SavedApiKey) => {
    setError("");
    setLoading(true);
    try {
      const result = await validateCredentials({ apiKey: saved.apiKey, endpoint: saved.endpoint });
      if (!result.success) {
        setError(result.error);
        return;
      }
      login(saved.apiKey, saved.endpoint);
      router.push("/dashboard");
    } catch {
      setError("Error al conectar con la API");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!saveLabel.trim() || !apiKey.trim()) return;
    addKey(saveLabel.trim(), apiKey.trim(), endpoint.trim() || DEFAULT_ENDPOINT);
    setSaveOpen(false);
    setSaveLabel("");
  };

  const handleEditSave = () => {
    if (!editKey || !editLabel.trim()) return;
    updateKey(editKey.id, {
      label: editLabel.trim(),
      apiKey: editApiKey.trim() || editKey.apiKey,
      endpoint: editEndpoint.trim() || DEFAULT_ENDPOINT,
    });
    setEditKey(null);
  };

  const openEdit = (k: SavedApiKey) => {
    setEditKey(k);
    setEditLabel(k.label);
    setEditApiKey(k.apiKey);
    setEditEndpoint(k.endpoint);
    setShowEditKey(false);
  };

  const handleUseKey = (saved: SavedApiKey) => {
    setApiKey(saved.apiKey);
    setEndpoint(saved.endpoint);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Login form */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Pyx Pay</CardTitle>
            <CardDescription>
              Ingrese su API Key para acceder al panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Ingrese su API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endpoint">Endpoint de API</Label>
                <Input
                  id="endpoint"
                  type="url"
                  placeholder={DEFAULT_ENDPOINT}
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Default: {DEFAULT_ENDPOINT}
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Validando..." : "Ingresar"}
                </Button>
                {apiKey.trim() && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Guardar API Key"
                    onClick={() => setSaveOpen(true)}
                  >
                    <IconDeviceFloppy className="size-4" />
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Saved keys */}
        {hydrated && keys.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <IconKey className="size-4" />
                Claves guardadas
              </CardTitle>
              <CardDescription>
                Seleccione una clave para ingresar rápidamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="group flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleQuickLogin(k)}>
                    <p className="text-sm font-medium truncate">{k.label}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {maskKey(k.apiKey)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Usar en formulario"
                      onClick={() => handleUseKey(k)}
                    >
                      <IconPlus className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Editar"
                      onClick={() => openEdit(k)}
                    >
                      <IconPencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive"
                      title="Eliminar"
                      onClick={() => setDeleteId(k.id)}
                    >
                      <IconTrash className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      disabled={loading}
                      onClick={() => handleQuickLogin(k)}
                    >
                      <IconLogin className="size-3.5" />
                      Login
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Save dialog */}
        <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Guardar API Key</DialogTitle>
              <DialogDescription>
                Dale un nombre para identificarla fácilmente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input
                  placeholder="Ej: Producción, Test, Cliente X..."
                  value={saveLabel}
                  onChange={(e) => setSaveLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Key: {maskKey(apiKey)} · {endpoint || DEFAULT_ENDPOINT}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!saveLabel.trim()}>
                <IconDeviceFloppy className="size-4" />
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit dialog */}
        <Dialog open={!!editKey} onOpenChange={(o) => !o && setEditKey(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Editar API Key</DialogTitle>
              <DialogDescription>Modifica los datos de la clave guardada</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>API Key</Label>
                <div className="relative">
                  <Input
                    type={showEditKey ? "text" : "password"}
                    value={editApiKey}
                    onChange={(e) => setEditApiKey(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowEditKey(!showEditKey)}
                  >
                    {showEditKey ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Endpoint</Label>
                <Input
                  value={editEndpoint}
                  onChange={(e) => setEditEndpoint(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditKey(null)}>
                Cancelar
              </Button>
              <Button onClick={handleEditSave}>
                <IconDeviceFloppy className="size-4" />
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirm dialog */}
        <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle>Eliminar clave</DialogTitle>
              <DialogDescription>
                ¿Estás seguro que deseas eliminar esta API Key guardada? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteId) removeKey(deleteId);
                  setDeleteId(null);
                }}
              >
                <IconTrash className="size-4" />
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
