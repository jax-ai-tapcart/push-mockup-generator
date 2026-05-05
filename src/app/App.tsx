import { useRef, useState } from "react";
import { Loader2, Download } from "lucide-react";
import html2canvas from "html2canvas";
import { MockupCanvas, type MockupConfig } from "./components/MockupCanvas";

const DEFAULT_CONFIG: MockupConfig = {
  brandName: "Lola Blankets",
  brandDomain: "lolablankets.com",
  logoUrl: "https://lolablankets.com/cdn/shop/files/Lola_Logomark_Lola_Oat_2.png?v=1765384363&width=300",
  logoBgHex: "#3A2A1F",
  heroUrl: "https://cdn.shopify.com/s/files/1/0538/5931/9979/files/desktop-neutrals-5.jpg?v=1741955632",
  smsMsg2: "Lola Blankets: Hi [First name], our biggest sale of the season is on. 25% off sitewide with code SOFT25. Limited stock, don\u0027t miss out.\\nhttps://lolablankets.com/CyuPTzr47ul\\nReply STOP to end.",
  pushTitle: "[First name], 25% off your cart.",
  pushBody: "The throw you\u0027ve been eyeing is 25% off. Shop now.",
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => resolve((ev.target?.result as string) ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [config, setConfig] = useState<MockupConfig>({ ...DEFAULT_CONFIG });
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);

  const update = (patch: Partial<MockupConfig>) => setConfig((prev) => ({ ...prev, ...patch }));

  const handleExport = async () => {
    setError("");
    if (!canvasRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(canvasRef.current, { backgroundColor: null, scale: 2, useCORS: true, allowTaint: true });
      canvas.toBlob((blob) => {
        if (!blob) { setError("Failed to render PNG"); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SMS vs Push for ${config.brandName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleLogoUpload = async (file: File | undefined) => {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    update({ logoUrl: dataUrl });
  };

  const handleHeroUpload = async (file: File | undefined) => {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    update({ heroUrl: dataUrl });
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-8">
      <div className="max-w-[1800px] mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">SMS vs Push Mockup Generator</h1>
          <p className="text-gray-400">Build side-by-side SMS vs Push comparison mockups for Tapcart sales.</p>
        </header>
        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">{error}</div>}
        <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-8">
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 space-y-5 self-start">
            <h2 className="text-xl font-semibold">Brand Config</h2>
            <Field label="Brand Name" value={config.brandName} onChange={(v) => update({ brandName: v })} />
            <Field label="Brand Domain" value={config.brandDomain} onChange={(v) => update({ brandDomain: v })} placeholder="example.com" />
            <div className="space-y-2">
              <label className="text-sm text-gray-400 block">Brand Logo</label>
              <div className="flex gap-2">
                <input type="url" value={config.logoUrl ?? ""} onChange={(e) => update({ logoUrl: e.target.value || null })} placeholder="https://..." className="flex-1 px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm" />
                <label className="px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg text-sm text-gray-300 hover:bg-gray-900 cursor-pointer">
                  Upload<input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e.target.files?.[0])} />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">Logo BG</label>
                <input type="color" value={config.logoBgHex} onChange={(e) => update({ logoBgHex: e.target.value })} className="w-8 h-8 rounded cursor-pointer bg-transparent border border-gray-800" />
                <input type="text" value={config.logoBgHex} onChange={(e) => update({ logoBgHex: e.target.value })} className="w-20 px-2 py-1 bg-[#0f0f0f] border border-gray-800 rounded text-sm text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400 block">Hero Image</label>
              <div className="flex gap-2">
                <input type="url" value={config.heroUrl ?? ""} onChange={(e) => update({ heroUrl: e.target.value || null })} placeholder="https://..." className="flex-1 px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm" />
                <label className="px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg text-sm text-gray-300 hover:bg-gray-900 cursor-pointer">
                  Upload<input type="file" accept="image/*" className="hidden" onChange={(e) => handleHeroUpload(e.target.files?.[0])} />
                </label>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">SMS Promo Message</label>
              <textarea value={config.smsMsg2} onChange={(e) => update({ smsMsg2: e.target.value })} rows={5} className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm" />
              <p className="text-xs text-gray-500 mt-1">Use \n for line breaks. URL and &quot;Reply STOP&quot; should be on separate lines.</p>
            </div>
            <Field label="Push Title" value={config.pushTitle} onChange={(v) => update({ pushTitle: v })} placeholder="[First name], 25% off your cart." />
            <div>
              <label className="text-sm text-gray-400 block mb-1">Push Body</label>
              <textarea value={config.pushBody} onChange={(e) => update({ pushBody: e.target.value })} rows={2} className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm" />
            </div>
            <button onClick={handleExport} disabled={isExporting} className="w-