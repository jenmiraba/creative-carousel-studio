import { useState } from "react";
import type { NotionPost, GeneratedData, Slide } from "@/types/carousel";

interface StepContentProps {
  selectedPost: NotionPost | null;
  anthropicKey: string;
  onGenerated: (data: GeneratedData) => void;
  onNext: () => void;
}

const TOOLS = ["Power BI", "Power Query", "DAX", "Microsoft Fabric", "Excel", "Python", "SQL", "General datos"];
const SLIDE_COUNTS = [4, 7, 10, 13];
const TIPOS: Record<string, string> = {
  tutorial: "Tutorial paso a paso",
  tips: "Lista de tips",
  novedades: "Novedades del mes",
  concepto: "Explicación de concepto",
  comparativa: "Comparativa",
  errores: "Errores comunes + soluciones",
  arsenal: "Arsenal de fórmulas",
};

const StepContent = ({ selectedPost, anthropicKey, onGenerated, onNext }: StepContentProps) => {
  const [tab, setTab] = useState<"ai" | "manual">("ai");
  const [tool, setTool] = useState(TOOLS[0]);
  const [slideCount, setSlideCount] = useState(7);
  const [tipo, setTipo] = useState("comparativa");
  const [tema, setTema] = useState("");
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [logs, setLogs] = useState<{ cls: string; text: string }[]>([]);
  const [manualSlides, setManualSlides] = useState<string[]>(Array(7).fill(""));
  const [manualCount, setManualCount] = useState(7);

  const addLog = (cls: string, text: string) => setLogs(prev => [...prev, { cls, text }]);

  const generateAI = async () => {
    if (!anthropicKey) { alert("Necesitás configurar la Anthropic API Key primero."); return; }
    if (!selectedPost) { alert("Seleccioná un post primero."); return; }

    setGenerating(true);
    setLogs([]);
    addLog("ac", "Conectando con Claude...");

    const topicName = tema.trim() || selectedPost.title;
    const tipoLabel = TIPOS[tipo];

    const prompt = `Sos el social media manager de Jennifer Miraballes (@myds_journey), analista de datos freelance con 18+ años de experiencia.

Jennifer publica en Instagram y LinkedIn sobre Power BI, DAX, Power Query, Python, SQL, carrera y freelance en datos.
Audiencia: analistas principiantes y profesionales que quieren pasarse al mundo de los datos.

TONO OBLIGATORIO: conversacional, directo. Usá "vos" SIEMPRE (nunca "tú") — rioplatense. Frases cortas, una idea por línea.
NUNCA: "En el mundo actual", "Es fundamental", "No hay duda de que", "Como todos sabemos"

GANCHO (línea 1): genera curiosidad inmediata.

EMOJIS: ⭕ errores · ✅ soluciones · 🔹 consejos · 📌 puntos clave · ❌ vs ✅ comparar · → secuencias

SLIDES (texto va sobre diseño visual en Canva): máximo 4-5 líneas por slide, UNA idea por slide.

Carrusel "${topicName}":
- Herramienta: ${tool}
- Tipo: ${tipoLabel}
- Slides: ${slideCount}
${notes ? "- Notas: " + notes : ""}

Devolvé SOLO JSON válido sin markdown ni texto extra:
{"title":"título máx 8 palabras","hashtags":["#powerbi","#datos"],"caption":"texto completo Instagram/LinkedIn con gancho desarrollo y pregunta final","slides":[{"type":"cover","title":"gancho portada","subtitle":"subtítulo"},{"type":"content","heading":"título","body":"cuerpo\\nconciso"},{"type":"cta","heading":"Jennifer Miraballes | myds_journey","body":"Seguime para contenido semanal..."}]}
Total exacto: ${slideCount} slides. Primer slide = cover, último = cta.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, messages: [{ role: "user", content: prompt }] }),
      });

      if (!res.ok) throw new Error("API " + res.status);
      const d = await res.json();
      const raw = d.content.map((b: any) => b.text || "").join("");
      addLog("ok", "✓ Contenido generado");

      const parsed = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
      parsed.slides = parsed.slides.map((s: any) => ({
        ...s,
        text: s.type === "cover" ? `${s.title}\n${s.subtitle || ""}` : s.type === "cta" ? `${s.heading}\n${s.body}` : `${s.heading}\n\n${s.body}`,
      }));

      addLog("ok", `✓ ${parsed.slides.length} slides listos`);
      onGenerated(parsed);
      setTimeout(() => onNext(), 400);
    } catch (e: any) {
      addLog("er", "Error: " + e.message);
      console.error(e);
    }
    setGenerating(false);
  };

  const useManual = () => {
    const slides: Slide[] = manualSlides.slice(0, manualCount).map((text, i) => ({
      type: i === 0 ? "cover" : i === manualCount - 1 ? "cta" : "content",
      text,
    }));
    onGenerated({ slides, hashtags: [], caption: "" });
    onNext();
  };

  const updateManualCount = (n: number) => {
    setManualCount(n);
    setManualSlides(prev => {
      const next = [...prev];
      while (next.length < n) next.push("");
      return next;
    });
  };

  return (
    <div className="surface-1 border border-border rounded-lg p-6">
      <p className="text-[13px] text-muted-foreground/80 mb-5 leading-relaxed">
        Generá el contenido con IA o escribilo vos directamente slide por slide.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-background border border-border rounded-lg p-0.5">
        <button
          onClick={() => setTab("ai")}
          className={`flex-1 py-2 rounded-md text-xs transition-all cursor-pointer ${tab === "ai" ? "surface-2 text-foreground border border-border-strong" : "text-muted-foreground border border-transparent"}`}
        >
          ✨ Generar con IA
        </button>
        <button
          onClick={() => setTab("manual")}
          className={`flex-1 py-2 rounded-md text-xs transition-all cursor-pointer ${tab === "manual" ? "surface-2 text-foreground border border-border-strong" : "text-muted-foreground border border-transparent"}`}
        >
          ✏️ Escribir manualmente
        </button>
      </div>

      {tab === "ai" ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
            <div>
              <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider block mb-1.5">Herramienta</span>
              <select value={tool} onChange={e => setTool(e.target.value)} className="w-full bg-background border border-border rounded-lg text-foreground text-[13px] py-2.5 px-3 outline-none focus:border-primary">
                {TOOLS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider block mb-1.5">Cantidad de slides</span>
              <select value={slideCount} onChange={e => setSlideCount(Number(e.target.value))} className="w-full bg-background border border-border rounded-lg text-foreground text-[13px] py-2.5 px-3 outline-none focus:border-primary">
                {SLIDE_COUNTS.map(n => <option key={n} value={n}>{n} slides</option>)}
              </select>
            </div>
          </div>

          <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider block mb-1.5">Tipo de carrusel</span>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full bg-background border border-border rounded-lg text-foreground text-[13px] py-2.5 px-3 outline-none focus:border-primary mb-3.5">
            {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider block mb-1.5">Tema (si es distinto al título del post)</span>
          <input value={tema} onChange={e => setTema(e.target.value)} placeholder="Dejar vacío para usar el título del post" className="w-full bg-background border border-border rounded-lg text-foreground text-[13px] py-2.5 px-3 outline-none focus:border-primary mb-3.5" />

          <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider block mb-1.5">Notas adicionales (opcional)</span>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Puntos a incluir, nivel de audiencia, ejemplos específicos..." className="w-full bg-background border border-border rounded-lg text-foreground text-[13px] py-2.5 px-3 outline-none focus:border-primary mb-3.5 min-h-[72px] resize-y" />

          <button onClick={generateAI} disabled={generating} className="px-4 py-2.5 rounded-lg text-[13px] cursor-pointer bg-primary text-primary-foreground border border-primary hover:opacity-90 disabled:opacity-35 disabled:cursor-not-allowed flex items-center gap-2">
            ✨ Generar contenido
          </button>

          {logs.length > 0 && (
            <div className="bg-background border border-border rounded-lg p-3.5 font-mono text-[11px] leading-[2] mt-3.5">
              {logs.map((l, i) => (
                <div key={i} className={`flex items-center gap-2 ${l.cls === "ok" ? "text-success" : l.cls === "er" ? "text-accent" : l.cls === "ac" ? "text-primary" : "text-muted-foreground"}`}>
                  {l.cls === "ac" && <div className="w-[11px] h-[11px] border-[1.5px] border-border-strong border-t-primary rounded-full animate-spin-slow shrink-0" />}
                  {l.text}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-3.5">
            <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider block mb-1.5">Cantidad de slides</span>
            <select value={manualCount} onChange={e => updateManualCount(Number(e.target.value))} className="w-full bg-background border border-border rounded-lg text-foreground text-[13px] py-2.5 px-3 outline-none focus:border-primary">
              {SLIDE_COUNTS.map(n => <option key={n} value={n}>{n} slides</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            {Array.from({ length: manualCount }).map((_, i) => {
              const type = i === 0 ? "Portada" : i === manualCount - 1 ? "CTA Final" : `Slide ${i + 1}`;
              return (
                <div key={i} className="bg-background border border-border rounded-lg p-3 flex gap-2.5">
                  <div className="w-6 h-6 rounded-md surface-3 flex items-center justify-center text-[10px] font-mono text-muted-foreground shrink-0 mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-primary font-mono uppercase tracking-wider mb-1">{type}</div>
                    <textarea
                      value={manualSlides[i] || ""}
                      onChange={e => {
                        const next = [...manualSlides];
                        next[i] = e.target.value;
                        setManualSlides(next);
                      }}
                      placeholder={i === 0 ? "Título de portada\nSubtítulo breve" : "Contenido del slide..."}
                      className="w-full bg-transparent border-none text-foreground text-xs leading-relaxed outline-none resize-y min-h-[72px] p-0"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={useManual} className="px-4 py-2.5 rounded-lg text-[13px] cursor-pointer bg-primary text-primary-foreground border border-primary hover:opacity-90">
            Usar este contenido →
          </button>
        </>
      )}
    </div>
  );
};

export default StepContent;
