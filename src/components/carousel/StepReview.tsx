import { useState, useEffect } from "react";
import type { GeneratedData } from "@/types/carousel";

interface StepReviewProps {
  genData: GeneratedData | null;
  onUpdate: (data: GeneratedData) => void;
  onBack: () => void;
  onNext: () => void;
}

const StepReview = ({ genData, onUpdate, onBack, onNext }: StepReviewProps) => {
  const [slideTexts, setSlideTexts] = useState<string[]>([]);
  const [caption, setCaption] = useState("");

  useEffect(() => {
    if (genData) {
      setSlideTexts(genData.slides.map(s => s.text));
      setCaption(genData.caption || "");
    }
  }, [genData]);

  if (!genData) return null;

  const syncData = () => {
    const updated: GeneratedData = {
      ...genData,
      caption,
      slides: genData.slides.map((s, i) => ({ ...s, text: slideTexts[i] || "" })),
    };
    onUpdate(updated);
  };

  const handleNext = () => { syncData(); onNext(); };

  return (
    <div className="surface-1 border border-border rounded-lg p-6">
      <p className="text-[13px] text-muted-foreground/80 mb-5 leading-relaxed">
        Revisá y editá el contenido haciendo clic en cualquier slide. También podés editar el caption.
      </p>

      {/* Hashtags */}
      {genData.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {genData.hashtags.map(h => (
            <span key={h} className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-[10px] font-mono">{h}</span>
          ))}
        </div>
      )}

      {/* Caption */}
      {caption && (
        <div className="bg-background border border-border rounded-lg p-3.5 mb-3.5">
          <label className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider block mb-1.5">Caption para Instagram / LinkedIn</label>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            className="w-full bg-transparent border-none text-foreground text-xs leading-relaxed outline-none resize-y min-h-[100px] p-0"
          />
        </div>
      )}

      {/* Slides */}
      <div className="flex flex-col gap-2 mb-4">
        {genData.slides.map((s, i) => {
          const label = s.type === "cover" ? "Portada" : s.type === "cta" ? "CTA Final" : `Slide ${i + 1}`;
          return (
            <div key={i} className="bg-background border border-border rounded-lg p-3 flex gap-2.5">
              <div className="w-6 h-6 rounded-md surface-3 flex items-center justify-center text-[10px] font-mono text-muted-foreground shrink-0 mt-0.5">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-primary font-mono uppercase tracking-wider mb-1">{label}</div>
                <textarea
                  value={slideTexts[i] || ""}
                  onChange={e => {
                    const next = [...slideTexts];
                    next[i] = e.target.value;
                    setSlideTexts(next);
                  }}
                  className="w-full bg-transparent border-none text-foreground text-xs leading-relaxed outline-none resize-y min-h-[48px] p-0 whitespace-pre-wrap"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2.5 mt-4">
        <button onClick={onBack} className="px-4 py-2.5 rounded-lg text-[13px] cursor-pointer surface-2 text-foreground border border-border-strong hover:surface-3 transition-all">
          ← Volver
        </button>
        <button onClick={handleNext} className="px-4 py-2.5 rounded-lg text-[13px] cursor-pointer bg-success/[0.12] text-success border border-success/30 hover:bg-success/20 transition-all">
          Crear en Canva →
        </button>
      </div>
    </div>
  );
};

export default StepReview;
