import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface ConfigPanelProps {
  apiKeys: { anthropic: string; notion: string; canva: string };
  onChange: (keys: { anthropic: string; notion: string; canva: string }) => void;
}

const fields = [
  { key: "anthropic" as const, label: "Anthropic API Key", placeholder: "sk-ant-...", hint: "console.anthropic.com", url: "https://console.anthropic.com/settings/keys" },
  { key: "notion" as const, label: "Notion Integration Token", placeholder: "secret_...", hint: "notion.so/my-integrations", url: "https://www.notion.so/my-integrations" },
  { key: "canva" as const, label: "Canva API Key", placeholder: "OC-...", hint: "canva.com/developers", url: "https://www.canva.com/developers" },
];

const ConfigPanel = ({ apiKeys, onChange }: ConfigPanelProps) => {
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  const toggleVis = (key: string) => setVisible(v => ({ ...v, [key]: !v[key] }));

  const save = () => {
    Object.entries(apiKeys).forEach(([k, v]) => localStorage.setItem(`cs_key_${k}`, v));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="surface-1 border border-border rounded-lg p-5 mb-5">
      <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3.5 flex items-center gap-2">
        🔑 Configuración de API Keys
        <span className="flex-1 h-px bg-border" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {fields.map(f => (
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
