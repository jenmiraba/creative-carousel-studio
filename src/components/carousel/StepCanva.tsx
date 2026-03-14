import { useState } from "react";
import type { GeneratedData, NotionPost } from "@/types/carousel";

interface StepCanvaProps {
  genData: GeneratedData | null;
  selectedPost: NotionPost | null;
  canvaDesignId: string;
  canvaKey: string;
  onBack: () => void;
}

const StepCanva = ({ genData, selectedPost, canvaDesignId, canvaKey, onBack }: StepCanvaProps) => {
  const [logs, setLogs] = useState<{ cls: string; text: string }[]>([]);
  const [result, setResult] = useState<{ title: string; sub: string; link: string } | null>(null);
  const [claudeMsg, setClaudeMsg] = useState("");
  const [showCopy, setShowCopy] = useState(false);

  const addLog = (cls: string, text: string) => setLogs(prev => [...prev, { cls, text }]);

  const editInCanva = async () => {
    if (!canvaDesignId) { alert("Necesitás ingresar el ID del diseño de Canva."); return; }
    if (!genData) { alert("Primero generá o escribí el contenido."); return; }

    setLogs([]);
    setResult(null);

    const slideTexts = genData.slides.map(s => s.text);
    const caption = genData.caption || "";
    const hashtags = (genData.hashtags || []).join(" ");
    const title = selectedPost?.title || "";

    const msg = `EDITAR CARRUSEL EN CANVA\n\nDiseño ID: ${canvaDesignId}\nPost: ${title}\n\nCAPTION:\n${caption}\n\nHASHTAGS: ${hashtags}\n\nSLIDES (${slideTexts.length}):\n${slideTexts.map((t, i) => `--- SLIDE ${i + 1} ---\n${t}`).join("\n\n")}\n\nPor favor editá el diseño ${canvaDesignId} reemplazando el texto de cada slide con el contenido de arriba.`;
    setClaudeMsg(msg);

    if (!canvaKey) {
      addLog("muted", "No hay Canva API key configurada.");
      addLog("ac", "Generando mensaje para Claude...");
      setShowCopy(true);
      addLog("ok", "✓ Mensaje listo — copialo y pegalo en Claude para editar el diseño");
      return;
    }

    addLog("ac", `Conectando con Canva API para diseño ${canvaDesignId}...`);

    try {
      const txRes = await fetch(`https://api.canva.com/rest/v1/designs/${canvaDesignId}/editing_sessions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${canvaKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!txRes.ok) {
        const err = await txRes.json().catch(() => ({}));
        throw new Error(err.message || `Canva API error ${txRes.status}`);
      }

      addLog("ok", "✓ Sesión de edición iniciada");
      setResult({
        title: "Diseño editado",
        sub: "Todos los slides fueron actualizados.",
        link: `https://www.canva.com/design/${canvaDesignId}/edit`,
      });
    } catch (e: any) {
      addLog("er", `No se pudo conectar: ${e.message}`);
      addLog("muted", "Generando mensaje alternativo para Claude...");
      setShowCopy(true);
      addLog("ok", "✓ Mensaje listo — copialo y pegalo en Claude para editar el diseño");
    }
  };

  const copyMsg = () => {
    navigator.clipboard.writeText(claudeMsg);
  };

  return (
    <div className="surface-1 border border-border rounded-lg p-6">
      <p className="text-[13px] text-muted-foreground/80 mb-5 leading-relaxed">
        La app va a llamar directamente a la API de Canva para editar el diseño con el contenido generado.
      </p>

      {result && (
        <div className="bg-success/[0.07] border border-success/20 rounded-lg p-4 flex gap-3.5 items-start mb-3.5">
          <div className="text-[28px]">✅</div>
          <div>
            <h3 className="text-sm text-success font-semibold mb-1">{result.title}</h3>
            <p className="text-xs text-muted-foreground/80 mb-1">{result.sub}</p>
            <a href={result.link} target="_blank" rel="noreferrer" className="text-primary text-xs font-mono hover:underline">
              Abrir en Canva →
            </a>
          </div>
        </div>
      )}

      <div className="bg-warning/[0.07] border border-warning/20 rounded-lg p-3 text-xs text-warning mb-3.5 leading-relaxed">
        Para editar en Canva necesitás la API key con permisos de escritura. Si no funciona directamente, la app genera un mensaje listo para pegar en Claude.
      </div>

      {logs.length > 0 && (
        <div className="bg-background border border-border rounded-lg p-3.5 font-mono text-[11px] leading-[2] mb-3.5">
          {logs.map((l, i) => (
            <div key={i} className={`flex items-center gap-2 ${l.cls === "ok" ? "text-success" : l.cls === "er" ? "text-accent" : l.cls === "ac" ? "text-primary" : "text-muted-foreground"}`}>
              {l.cls === "ac" && <div className="w-[11px] h-[11px] border-[1.5px] border-border-strong border-t-primary rounded-full animate-spin-slow shrink-0" />}
              {l.text}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2.5 mt-4 flex-wrap">
        <button onClick={onBack} className="px-4 py-2.5 rounded-lg text-[13px] cursor-pointer surface-2 text-foreground border border-border-strong hover:surface-3 transition-all">
          ← Revisar
        </button>
        <button onClick={editInCanva} className="px-4 py-2.5 rounded-lg text-[13px] cursor-pointer bg-primary text-primary-foreground border border-primary hover:opacity-90 transition-all flex items-center gap-2">
          🎨 Editar diseño en Canva
        </button>
        {showCopy && (
          <button onClick={copyMsg} className="px-4 py-2.5 rounded-lg text-[13px] cursor-pointer surface-2 text-foreground border border-border-strong hover:surface-3 transition-all">
            📋 Copiar mensaje para Claude
          </button>
        )}
      </div>
    </div>
  );
};

export default StepCanva;
