import { useState } from "react";
import type { GeneratedData, NotionPost } from "@/types/carousel";

interface StepCanvaProps {
  genData: GeneratedData | null;
  selectedPost: NotionPost | null;
  canvaDesignId: string;
  onBack: () => void;
}

const StepCanva = ({ genData, selectedPost, canvaDesignId, onBack }: StepCanvaProps) => {
  const [copied, setCopied] = useState(false);

  const slideTexts = genData?.slides.map(s => s.text) || [];
  const caption = genData?.caption || "";
  const hashtags = (genData?.hashtags || []).join(" ");
  const title = selectedPost?.title || "";

  const claudeMsg = `EDITAR CARRUSEL EN CANVA

Diseño ID: ${canvaDesignId}
Link: https://www.canva.com/design/${canvaDesignId}/edit
Post: ${title}

CAPTION:
${caption}

HASHTAGS: ${hashtags}

SLIDES (${slideTexts.length}):
${slideTexts.map((t, i) => `--- SLIDE ${i + 1} ---\n${t}`).join("\n\n")}

Por favor editá el diseño ${canvaDesignId} en Canva reemplazando el texto de cada slide con el contenido de arriba.`;

  const copyMsg = () => {
    navigator.clipboard.writeText(claudeMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="surface-1 border border-border rounded-lg p-6">
      <p className="text-[13px] text-muted-foreground/80 mb-5 leading-relaxed">
        Copiá el mensaje y pegalo en Claude para que edite tu diseño de Canva automáticamente.
      </p>

      <div className="bg-background border border-border rounded-lg p-4 font-mono text-[11px] leading-relaxed mb-4 max-h-[300px] overflow-y-auto whitespace-pre-wrap text-muted-foreground">
        {claudeMsg}
      </div>

      <div className="flex gap-2.5 mt-4 flex-wrap">
        <button onClick={onBack} className="px-4 py-2.5 rounded-lg text-[13px] cursor-pointer surface-2 text-foreground border border-border-strong hover:surface-3 transition-all">
          ← Revisar
        </button>
        <button onClick={copyMsg} className="px-4 py-2.5 rounded-lg text-[13px] cursor-pointer bg-primary text-primary-foreground border border-primary hover:opacity-90 transition-all flex items-center gap-2">
          {copied ? "✅ Copiado!" : "📋 Copiar mensaje para Claude"}
        </button>
      </div>
    </div>
  );
};

export default StepCanva;
