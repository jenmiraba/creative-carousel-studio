import { useState } from "react";
import type { NotionPost, FilterType } from "@/types/carousel";

interface StepNotionProps {
  posts: NotionPost[];
  selectedPost: NotionPost | null;
  canvaDesignId: string;
  filter: FilterType;
  notionKey: string;
  onPostsLoaded: (posts: NotionPost[]) => void;
  onSelectPost: (post: NotionPost) => void;
  onCanvaIdChange: (id: string) => void;
  onFilterChange: (f: FilterType) => void;
  onContinue: () => void;
}

const NOTION_DB = "31fb9c1c-c8bc-8012-9785-000b76cf7cba";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "carrusel", label: "Carrusel" },
  { key: "canva", label: "Herramienta Canva" },
  { key: "sinlink", label: "Sin link Canva" },
];

const StepNotion = ({
  posts, selectedPost, canvaDesignId, filter, notionKey,
  onPostsLoaded, onSelectPost, onCanvaIdChange, onFilterChange, onContinue,
}: StepNotionProps) => {
  const [loading, setLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState<"idle" | "ok" | "error">("idle");

  const filteredPosts = posts.filter(p => {
    if (filter === "carrusel") return p.formato.toLowerCase() === "carrusel";
    if (filter === "canva") return p.herramientas.includes("Canva");
    if (filter === "sinlink") return !p.linkCanva;
    return true;
  });

  const loadNotion = async () => {
    if (!notionKey) { alert("Necesitás configurar el Notion Integration Token primero."); return; }
    setLoading(true);
    setLoadStatus("idle");

    try {
      const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB}/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionKey}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page_size: 100, sorts: [{ property: "userDefined:ID", direction: "descending" }] }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();

      const mapped: NotionPost[] = data.results.map((p: any) => {
        const props = p.properties;
        return {
          id: p.id,
          num: props["userDefined:ID"]?.unique_id?.number || "",
          title: props["Título del Post"]?.title?.[0]?.plain_text || "(Sin título)",
          formato: props["Formato"]?.select?.name || "",
          herramientas: (props["Herramientas"]?.multi_select || []).map((h: any) => h.name),
          estatus: props["Estatus"]?.select?.name || "",
          canal: (props["Canal"]?.multi_select || []).map((c: any) => c.name),
          linkCanva: props["Link Canva"]?.rich_text?.[0]?.plain_text || "",
          slides: props["Slides"]?.number || "",
          pilar: props["Pilar de Contenido"]?.select?.name || "",
          caption: props["Copy/Caption"]?.rich_text?.[0]?.plain_text || "",
        };
      });

      onPostsLoaded(mapped);
      setLoadStatus("ok");
    } catch (e) {
      console.error(e);
      setLoadStatus("error");
    }
    setLoading(false);
  };

  const selectPost = (post: NotionPost) => {
    onSelectPost(post);
    if (post.linkCanva) {
      const match = post.linkCanva.match(/([A-Z][a-zA-Z0-9_-]{10})/);
      onCanvaIdChange(match ? match[1] : post.linkCanva);
    } else {
      onCanvaIdChange("");
    }
  };

  return (
    <div className="surface-1 border border-border rounded-lg p-6">
      <p className="text-[13px] text-muted-foreground/80 mb-5 leading-relaxed">
        Cargá tus posts desde Notion y seleccioná el carrusel que querés trabajar. Asegurate de que la integración de Notion tenga acceso a tu Content Hub.
      </p>

      {/* Filter bar */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className={`px-3 py-1.5 rounded-full border text-[11px] font-mono transition-all cursor-pointer ${
              filter === f.key
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground bg-transparent hover:border-border-strong"
            }`}
          >
            {f.label}
          </button>
        ))}
        <a
          href="https://www.notion.so/31fb9c1cc8bc803aa088c5026835f382"
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-[11px] text-primary font-mono hover:underline"
        >
          Abrir en Notion →
        </a>
      </div>

      {/* Load button */}
      <button
        onClick={loadNotion}
        disabled={loading}
        className={`w-full py-2.5 border border-dashed rounded-lg text-[12px] cursor-pointer transition-all mb-3.5 ${
          loadStatus === "ok"
            ? "border-success/30 text-success bg-success/5"
            : loadStatus === "error"
            ? "border-accent/30 text-accent bg-accent/5"
            : "border-border-strong text-muted-foreground/80 bg-foreground/[0.02] hover:border-primary hover:text-primary"
        }`}
      >
        {loading ? "⟳ Cargando..." : loadStatus === "ok" ? `✓ ${posts.length} posts cargados` : loadStatus === "error" ? "✗ Error — verificá tu token de Notion" : "⟳ Cargar posts desde Notion"}
      </button>

      {/* Posts list */}
      {filteredPosts.length > 0 && (
        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto mb-4 scrollbar-thin">
          {filteredPosts.map(p => (
            <button
              key={p.id}
              onClick={() => selectPost(p)}
              className={`w-full text-left bg-background border rounded-lg p-3 px-3.5 flex items-center gap-3 transition-all cursor-pointer ${
                selectedPost?.id === p.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary hover:bg-primary/5"
              }`}
            >
              {p.num && (
                <span className="text-[11px] font-mono text-primary bg-primary/15 px-2 py-0.5 rounded-full shrink-0">
                  #{p.num}
                </span>
              )}
              <span className="text-[13px] font-medium flex-1 truncate">{p.title}</span>
              <div className="flex gap-1.5 shrink-0">
                {p.formato && <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-primary/15 text-primary">{p.formato}</span>}
                {p.estatus && <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-foreground/[0.07] text-muted-foreground/80">{p.estatus}</span>}
                {p.canal.map(c => (
                  <span key={c} className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${c === "LinkedIn" ? "bg-blue-500/15 text-blue-400" : "bg-primary/15 text-primary"}`}>
                    {c}
                  </span>
                ))}
              </div>
              {p.linkCanva ? (
                <span className="text-[10px] text-success font-mono shrink-0">✓ {p.linkCanva.slice(0, 15)}</span>
              ) : (
                <span className="text-[10px] text-muted-foreground font-mono shrink-0">sin link</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Selected post info */}
      {selectedPost && (
        <div className="bg-primary/[0.08] border border-primary/20 rounded-lg p-3.5 mb-4">
          <div className="text-sm font-semibold mb-1">{selectedPost.title}</div>
          <div className="text-xs text-muted-foreground/80">
            {[selectedPost.formato, selectedPost.estatus, selectedPost.pilar, selectedPost.slides ? `${selectedPost.slides} slides` : ""].filter(Boolean).join(" · ")}
          </div>
          <div className="mt-2.5">
            <label className="text-[11px] text-primary font-mono block mb-1">ID del diseño en Canva (de la columna "Link Canva")</label>
            <input
              type="text"
              value={canvaDesignId}
              onChange={e => onCanvaIdChange(e.target.value)}
              placeholder="Ej: DAHD6xdeP5M"
              className="w-full bg-background border border-primary/30 rounded-lg text-foreground font-mono text-[11px] py-2 px-2.5 outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
      )}

      <div className="flex gap-2.5 mt-4">
        <button
          onClick={onContinue}
          disabled={!selectedPost}
          className="px-4 py-2.5 rounded-lg text-[13px] cursor-pointer flex items-center gap-2 transition-all bg-primary text-primary-foreground border border-primary hover:opacity-90 disabled:opacity-35 disabled:cursor-not-allowed"
        >
          Continuar →
        </button>
      </div>
    </div>
  );
};

export default StepNotion;
