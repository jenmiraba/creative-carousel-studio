import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { GeneratedData, NotionPost } from "@/types/carousel";

interface StepCanvaProps {
  genData: GeneratedData | null;
  selectedPost: NotionPost | null;
  canvaDesignId: string;
  onBack: () => void;
}

type EditStatus = "idle" | "starting" | "editing" | "committing" | "done" | "error";

const STATUS_LABELS: Record<EditStatus, string> = {
  idle: "",
  starting: "Iniciando edición…",
  editing: "Editando slides…",
  committing: "Guardando cambios…",
  done: "✅ Diseño actualizado",
  error: "❌ Error al editar",
};

const getValidCanvaToken = async (): Promise<string> => {
  const token = localStorage.getItem("cs_key_canva") || "";
  const expiresAt = Number(localStorage.getItem("cs_key_canva_expires") || "0");
  const refreshToken = localStorage.getItem("cs_key_canva_refresh") || "";

  // If token exists and not expired (with 60s buffer), use it
  if (token && expiresAt > Date.now() + 60000) {
    return token;
  }

  // Try to refresh
  if (refreshToken) {
    const { data, error } = await supabase.functions.invoke("canva-oauth", {
      body: { refresh_token: refreshToken },
    });
    if (!error && data?.access_token) {
      localStorage.setItem("cs_key_canva", data.access_token);
      if (data.refresh_token) localStorage.setItem("cs_key_canva_refresh", data.refresh_token);
      if (data.expires_in) {
        localStorage.setItem("cs_key_canva_expires", String(Date.now() + data.expires_in * 1000));
      }
      return data.access_token;
    }
    throw new Error("Token expirado. Reconectá Canva desde la configuración.");
  }

  if (!token) throw new Error("No hay token de Canva. Conectá Canva desde la configuración.");
  return token;
};

const StepCanva = ({ genData, selectedPost, canvaDesignId, onBack }: StepCanvaProps) => {
  const [status, setStatus] = useState<EditStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const slideTexts = genData?.slides?.map(s => s.text) || [];

  const invokeCanva = async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("canva-proxy", { body: payload });
    if (error) throw new Error(error.message || "Edge function error");
    if (data?.error) throw new Error(data.error?.message || data.error || `Canva API error`);
    return data;
  };

  const editInCanva = async () => {
    if (!canvaToken) {
      setErrorMsg("Necesitás configurar tu Canva API Key en el panel de configuración.");
      setStatus("error");
      return;
    }
    if (!canvaDesignId) {
      setErrorMsg("No hay un ID de diseño de Canva configurado.");
      setStatus("error");
      return;
    }
    if (slideTexts.length === 0) {
      setErrorMsg("No hay slides generados para editar.");
      setStatus("error");
      return;
    }

    try {
      setStatus("starting");
      setErrorMsg("");

      const canvaToken = await getValidCanvaToken();

      // 1. Start editing transaction
      const startRes = await invokeCanva({
        canvaToken,
        action: "start",
        designId: canvaDesignId,
      });
      const transactionId = startRes?.transaction_id;
      if (!transactionId) throw new Error("No se recibió transaction_id de Canva");

      // 2. Perform text replacements
      setStatus("editing");
      const operations = slideTexts.map((text, i) => ({
        type: "replace_text",
        target: { page_index: i },
        value: text,
      }));

      await invokeCanva({
        canvaToken,
        action: "perform",
        designId: canvaDesignId,
        transactionId,
        operations,
      });

      // 3. Commit
      setStatus("committing");
      await invokeCanva({
        canvaToken,
        action: "commit",
        designId: canvaDesignId,
        transactionId,
      });

      setStatus("done");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      console.error("Canva edit error:", e);
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  const isWorking = ["starting", "editing", "committing"].includes(status);

  return (
    <div className="surface-1 border border-border rounded-lg p-6">
      <p className="text-[13px] text-muted-foreground/80 mb-5 leading-relaxed">
        Editá tu diseño de Canva directamente con el contenido generado. Se reemplazará el texto de cada slide automáticamente.
      </p>

      {/* Design info */}
      <div className="bg-background border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[11px] font-mono text-muted-foreground">Diseño:</span>
          <span className="text-[13px] font-mono text-foreground">{canvaDesignId || "—"}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-muted-foreground">Slides:</span>
          <span className="text-[13px] font-mono text-foreground">{slideTexts.length}</span>
        </div>
        {selectedPost && (
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[11px] font-mono text-muted-foreground">Post:</span>
            <span className="text-[13px] text-foreground truncate">{selectedPost.title}</span>
          </div>
        )}
      </div>

      {/* Status message */}
      {status !== "idle" && (
        <div
          className={`rounded-lg p-3 mb-4 text-[13px] font-mono ${
            status === "done"
              ? "bg-success/10 text-success border border-success/20"
              : status === "error"
              ? "bg-destructive/10 text-destructive border border-destructive/20"
              : "bg-primary/10 text-primary border border-primary/20"
          }`}
        >
          <div>{STATUS_LABELS[status]}</div>
          {status === "error" && errorMsg && (
            <div className="text-[11px] mt-1 opacity-80">{errorMsg}</div>
          )}
          {status === "done" && (
            <a
              href={`https://www.canva.com/design/${canvaDesignId}/edit`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] mt-1 underline block"
            >
              Abrir diseño en Canva →
            </a>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2.5 mt-4 flex-wrap">
        <button
          onClick={onBack}
          disabled={isWorking}
          className="px-4 py-2.5 rounded-lg text-[13px] cursor-pointer surface-2 text-foreground border border-border-strong hover:surface-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Revisar
        </button>
        <button
          onClick={editInCanva}
          disabled={isWorking}
          className="px-4 py-2.5 rounded-lg text-[13px] cursor-pointer bg-primary text-primary-foreground border border-primary hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isWorking ? `⟳ ${STATUS_LABELS[status]}` : status === "done" ? "🔄 Editar de nuevo" : "✨ Editar en Canva"}
        </button>
      </div>
    </div>
  );
};

export default StepCanva;
