import { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff, Unplug, Plug } from "lucide-react";

interface ConfigPanelProps {
  apiKeys: { anthropic: string; notion: string; canva: string };
  onChange: (keys: { anthropic: string; notion: string; canva: string }) => void;
}

const textFields = [
  { key: "anthropic" as const, label: "Anthropic API Key", placeholder: "sk-ant-...", hint: "console.anthropic.com", url: "https://console.anthropic.com/settings/keys" },
  { key: "notion" as const, label: "Notion Integration Token", placeholder: "secret_...", hint: "notion.so/my-integrations", url: "https://www.notion.so/my-integrations" },
];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";

const ConfigPanel = ({ apiKeys, onChange }: ConfigPanelProps) => {
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [canvaConnected, setCanvaConnected] = useState(!!apiKeys.canva);

  useEffect(() => {
    setCanvaConnected(!!apiKeys.canva);
  }, [apiKeys.canva]);

  // Listen for OAuth popup message
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (data?.access_token) {
        localStorage.setItem("cs_key_canva", data.access_token);
        if (data.refresh_token) {
          localStorage.setItem("cs_key_canva_refresh", data.refresh_token);
        }
        if (data.expires_in) {
          const expiresAt = Date.now() + data.expires_in * 1000;
          localStorage.setItem("cs_key_canva_expires", String(expiresAt));
        }
        onChange({ ...apiKeys, canva: data.access_token });
        setCanvaConnected(true);
      } else if (data?.error) {
        console.error("Canva OAuth error:", data.error);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [apiKeys, onChange]);

  const toggleVis = (key: string) => setVisible(v => ({ ...v, [key]: !v[key] }));

  const save = () => {
    Object.entries(apiKeys).forEach(([k, v]) => {
      if (k !== "canva") localStorage.setItem(`cs_key_${k}`, v);
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const connectCanva = useCallback(() => {
    if (!CANVA_CLIENT_ID) {
      console.error("VITE_CANVA_CLIENT_ID not set");
      return;
    }
    const params = new URLSearchParams({
      response_type: "code",
      client_id: CANVA_CLIENT_ID,
      scope: "design:content:write",
      redirect_uri: REDIRECT_URI,
    });
    const authUrl = `https://www.canva.com/api/oauth/authorize?${params}`;
    window.open(authUrl, "canva-oauth", "width=600,height=700,popup=yes");
  }, []);

  const disconnectCanva = () => {
    localStorage.removeItem("cs_key_canva");
    localStorage.removeItem("cs_key_canva_refresh");
    localStorage.removeItem("cs_key_canva_expires");
    onChange({ ...apiKeys, canva: "" });
    setCanvaConnected(false);
  };

  return (
    <div className="surface-1 border border-border rounded-lg p-5 mb-5">
      <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3.5 flex items-center gap-2">
        🔑 Configuración de API Keys
        <span className="flex-1 h-px bg-border" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {textFields.map(f => (
          <div key={f.key}>
            <label className="text-[11px] text-muted-foreground font-mono block mb-1.5">{f.label}</label>
            <div className="relative">
              <input
                type={visible[f.key] ? "text" : "password"}
                value={apiKeys[f.key]}
                onChange={e => onChange({ ...apiKeys, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="w-full bg-background border border-border rounded-lg text-foreground font-mono text-[11px] py-2 pl-2.5 pr-9 outline-none transition-colors focus:border-primary"
              />
              <button
                onClick={() => toggleVis(f.key)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {visible[f.key] ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              <a href={f.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">Obtener →</a>
            </div>
          </div>
        ))}

        {/* Canva OAuth */}
        <div>
          <label className="text-[11px] text-muted-foreground font-mono block mb-1.5">Canva (OAuth)</label>
          {canvaConnected ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-background border border-border rounded-lg py-2 px-2.5 text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                <Plug size={13} className="text-primary" />
                <span className="text-primary">✅ Conectado</span>
              </div>
              <button
                onClick={disconnectCanva}
                className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
                title="Desconectar Canva"
              >
                <Unplug size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={connectCanva}
              className="w-full bg-background border border-border rounded-lg text-foreground font-mono text-[11px] py-2 px-2.5 cursor-pointer hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1.5"
            >
              <Plug size={13} />
              Conectar con Canva
            </button>
          )}
          <div className="text-[10px] text-muted-foreground mt-1">
            <a href="https://www.canva.com/developers" target="_blank" rel="noreferrer" className="text-primary hover:underline">Canva Developers →</a>
          </div>
        </div>
      </div>
      <div className="flex items-center mt-3.5">
        <button onClick={save} className="px-4 py-2 bg-primary/15 text-primary border border-primary/30 rounded-lg text-xs cursor-pointer hover:bg-primary/25 transition-colors">
          💾 Guardar keys en este navegador
        </button>
        {saved && <span className="text-[11px] text-success font-mono ml-2.5">✓ Guardadas</span>}
      </div>
    </div>
  );
};

export default ConfigPanel;
