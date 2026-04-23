import { useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import html2canvas from "html2canvas";
import {
  Loader2,
  Download,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trash2,
  Plus,
  Search,
} from "lucide-react";
import {
  NotificationCard,
  type NotificationCardData,
  type ImageTransform,
  DEFAULT_TRANSFORM,
} from "./components/NotificationCard";
import {
  researchBrand,
  brandNameFromUrl,
  searchProductImages,
} from "./utils/copyGenerator";

type ImageSource = "upload" | "url" | "search";

interface InputRow {
  id: string;
  brandUrl: string;
  logoSource: ImageSource;
  logoUrl: string;
  logoDataUrl: string;
  logoBgColor: string;
  logoTransform: ImageTransform;
  heroSource: ImageSource;
  heroUrl: string;
  heroDataUrl: string;
  heroTransform: ImageTransform;
  title: string;
  body: string;
  researching: boolean;
  researchError: string;
  brandNameOverride: string;
  searchResults: string[];
  searching: boolean;
  searchError: string;
  showAiCopy: boolean;
}

function makeId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyRow(): InputRow {
  return {
    id: makeId(),
    brandUrl: "",
    logoSource: "upload",
    logoUrl: "",
    logoDataUrl: "",
    logoBgColor: "#FFFFFF",
    logoTransform: { ...DEFAULT_TRANSFORM },
    heroSource: "upload",
    heroUrl: "",
    heroDataUrl: "",
    heroTransform: { ...DEFAULT_TRANSFORM },
    title: "",
    body: "",
    researching: false,
    researchError: "",
    brandNameOverride: "",
    searchResults: [],
    searching: false,
    searchError: "",
    showAiCopy: false,
  };
}

function resolveBrandName(row: InputRow): string {
  if (row.brandNameOverride.trim()) return row.brandNameOverride.trim();
  if (row.brandUrl.trim()) return brandNameFromUrl(row.brandUrl.trim());
  if (row.title.trim()) return row.title.trim().slice(0, 40);
  return "Brand";
}

function currentLogoSrc(row: InputRow): string {
  if (row.logoSource === "upload") return row.logoDataUrl;
  return row.logoUrl;
}

function currentHeroSrc(row: InputRow): string {
  if (row.heroSource === "upload") return row.heroDataUrl;
  return row.heroUrl;
}

function rowToCard(row: InputRow): NotificationCardData {
  return {
    brandName: resolveBrandName(row),
    logoUrl: currentLogoSrc(row),
    iconBgColor: row.logoBgColor,
    title: row.title || "Your push title",
    body: row.body || "Your push body copy appears here.",
    heroImageUrl: currentHeroSrc(row),
    logoTransform: row.logoTransform,
    heroTransform: row.heroTransform,
  };
}

function rowIsReady(row: InputRow): boolean {
  const hasLogo = !!currentLogoSrc(row).trim();
  const hasHero = !!currentHeroSrc(row).trim();
  const hasCopy = !!row.title.trim() && !!row.body.trim();
  return hasLogo && hasHero && hasCopy;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => resolve((ev.target?.result as string) ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [singleRow, setSingleRow] = useState<InputRow>(emptyRow());
  const [bulkRows, setBulkRows] = useState<InputRow[]>([emptyRow()]);
  const [bulkPreviewIndex, setBulkPreviewIndex] = useState(0);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isBulkExporting, setIsBulkExporting] = useState(false);

  const singlePreviewRef = useRef<HTMLDivElement>(null);
  const bulkPreviewRef = useRef<HTMLDivElement>(null);

  const activeBulkRow = bulkRows[bulkPreviewIndex];

  useEffect(() => {
    if (bulkPreviewIndex >= bulkRows.length) {
      setBulkPreviewIndex(Math.max(0, bulkRows.length - 1));
    }
  }, [bulkRows.length, bulkPreviewIndex]);

  const updateSingle = (patch: Partial<InputRow>) => {
    setSingleRow((prev) => ({ ...prev, ...patch }));
  };

  const updateBulkRow = (id: string, patch: Partial<InputRow>) => {
    setBulkRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };

  const addBulkRow = () => {
    setBulkRows((prev) => [...prev, emptyRow()]);
  };

  const removeBulkRow = (id: string) => {
    setBulkRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      return next.length === 0 ? [emptyRow()] : next;
    });
  };

  const runResearch = async (
    row: InputRow,
    apply: (patch: Partial<InputRow>) => void
  ) => {
    const url = row.brandUrl.trim();
    if (!url) {
      apply({ researchError: "Enter a brand URL first" });
      return;
    }
    apply({ researching: true, researchError: "" });
    try {
      const result = await researchBrand(url);
      apply({
        researching: false,
        title: result.title,
        body: result.body,
        brandNameOverride: result.brandName,
      });
    } catch (e) {
      apply({
        researching: false,
        researchError: e instanceof Error ? e.message : "Research failed",
      });
    }
  };

  const runImageSearch = async (
    row: InputRow,
    apply: (patch: Partial<InputRow>) => void
  ) => {
    const url = row.brandUrl.trim();
    if (!url) {
      apply({ searchError: "Enter a brand URL first" });
      return;
    }
    apply({ searching: true, searchError: "", searchResults: [] });
    try {
      const urls = await searchProductImages(url, 10);
      apply({
        searching: false,
        searchResults: urls,
        heroSource: "search",
      });
    } catch (e) {
      apply({
        searching: false,
        searchError: e instanceof Error ? e.message : "Image search failed",
      });
    }
  };

  const renderCard = async (
    node: HTMLDivElement | null
  ): Promise<Blob | null> => {
    if (!node) return null;
    const canvas = await html2canvas(node, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b)));
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportSingle = async () => {
    setError("");
    if (!rowIsReady(singleRow)) {
      setError("Fill in logo, hero image, title, and body before exporting.");
      return;
    }
    try {
      setIsExporting(true);
      const brand = resolveBrandName(singleRow);
      const blob = await renderCard(singlePreviewRef.current);
      if (!blob) throw new Error("Failed to render PNG");
      downloadBlob(blob, `${brand} Push Notification.png`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportBulkCurrent = async () => {
    setError("");
    if (!activeBulkRow || !rowIsReady(activeBulkRow)) {
      setError("This row is missing a logo, hero image, title, or body.");
      return;
    }
    try {
      setIsExporting(true);
      const brand = resolveBrandName(activeBulkRow);
      const blob = await renderCard(bulkPreviewRef.current);
      if (!blob) throw new Error("Failed to render PNG");
      downloadBlob(blob, `${brand} Push Notification.png`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportBulkZip = async () => {
    setError("");
    const readyRows = bulkRows.filter(rowIsReady);
    if (readyRows.length === 0) {
      setError("Fill in at least one complete row before exporting.");
      return;
    }
    setIsBulkExporting(true);
    const zip = new JSZip();
    const originalIndex = bulkPreviewIndex;
    try {
      for (let i = 0; i < bulkRows.length; i++) {
        if (!rowIsReady(bulkRows[i])) continue;
        setBulkPreviewIndex(i);
        await new Promise((r) => setTimeout(r, 350));
        const brand = resolveBrandName(bulkRows[i]);
        const blob = await renderCard(bulkPreviewRef.current);
        if (blob) {
          zip.file(`${brand} Push Notification.png`, blob);
        }
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, "push-notifications.zip");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk export failed");
    } finally {
      setBulkPreviewIndex(originalIndex);
      setIsBulkExporting(false);
    }
  };

  const singleCard = useMemo(() => rowToCard(singleRow), [singleRow]);
  const bulkCard = useMemo(
    () => (activeBulkRow ? rowToCard(activeBulkRow) : rowToCard(emptyRow())),
    [activeBulkRow]
  );


  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
            Tapcart Push Mockup Generator
          </h1>
          <p className="text-gray-400">
            Build pixel-perfect iOS push notification previews. Single or bulk.
          </p>
        </header>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setMode("single")}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              mode === "single"
                ? "bg-purple-600 text-white"
                : "bg-[#1a1a1a] text-gray-400 hover:text-white"
            }`}
          >
            Single Mode
          </button>
          <button
            onClick={() => setMode("bulk")}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              mode === "bulk"
                ? "bg-purple-600 text-white"
                : "bg-[#1a1a1a] text-gray-400 hover:text-white"
            }`}
          >
            Bulk Mode
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {mode === "single" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <InputPanel
              row={singleRow}
              onChange={updateSingle}
              onResearch={() => runResearch(singleRow, updateSingle)}
              onImageSearch={() => runImageSearch(singleRow, updateSingle)}
            />
            <div className="space-y-6">
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                <h2 className="text-xl font-semibold mb-4">Preview</h2>
                <div className="flex justify-center">
                  <NotificationCard ref={singlePreviewRef} data={singleCard} />
                </div>
                <button
                  onClick={handleExportSingle}
                  disabled={isExporting}
                  className="mt-6 w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Export PNG
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    Brands ({bulkRows.length})
                  </h2>
                  <button
                    onClick={addBulkRow}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium flex items-center gap-1 text-sm"
                  >
                    <Plus className="w-4 h-4" /> Add brand
                  </button>
                </div>
                {bulkRows.map((row, idx) => (
                  <div
                    key={row.id}
                    className={`rounded-lg border p-4 ${
                      idx === bulkPreviewIndex
                        ? "border-purple-500 bg-[#12121a]"
                        : "border-gray-800 bg-[#0f0f0f]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => setBulkPreviewIndex(idx)}
                        className="text-sm text-gray-300 hover:text-white"
                      >
                        Row {idx + 1} · {resolveBrandName(row)}
                      </button>
                      <button
                        onClick={() => removeBulkRow(row.id)}
                        className="text-gray-500 hover:text-red-400"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <InputPanel
                      row={row}
                      compact
                      onChange={(patch) => updateBulkRow(row.id, patch)}
                      onResearch={() =>
                        runResearch(row, (patch) =>
                          updateBulkRow(row.id, patch)
                        )
                      }
                      onImageSearch={() =>
                        runImageSearch(row, (patch) =>
                          updateBulkRow(row.id, patch)
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Preview</h2>
                  {bulkRows.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setBulkPreviewIndex(Math.max(0, bulkPreviewIndex - 1))
                        }
                        disabled={bulkPreviewIndex === 0}
                        className="p-2 bg-[#0f0f0f] hover:bg-gray-800 disabled:opacity-50 rounded-lg"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-sm text-gray-400">
                        {bulkPreviewIndex + 1} / {bulkRows.length}
                      </span>
                      <button
                        onClick={() =>
                          setBulkPreviewIndex(
                            Math.min(bulkRows.length - 1, bulkPreviewIndex + 1)
                          )
                        }
                        disabled={bulkPreviewIndex >= bulkRows.length - 1}
                        className="p-2 bg-[#0f0f0f] hover:bg-gray-800 disabled:opacity-50 rounded-lg"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex justify-center">
                  <NotificationCard ref={bulkPreviewRef} data={bulkCard} />
                </div>
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={handleExportBulkCurrent}
                    disabled={isExporting || isBulkExporting}
                    className="flex-1 px-4 py-3 bg-[#0f0f0f] border border-gray-800 hover:bg-gray-900 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Export Current PNG
                  </button>
                  <button
                    onClick={handleExportBulkZip}
                    disabled={isBulkExporting || isExporting}
                    className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    {isBulkExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Export All (ZIP)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Input panel ---------------- */

interface InputPanelProps {
  row: InputRow;
  onChange: (patch: Partial<InputRow>) => void;
  onResearch: () => void;
  onImageSearch: () => void;
  compact?: boolean;
}

function InputPanel({
  row,
  onChange,
  onResearch,
  onImageSearch,
  compact,
}: InputPanelProps) {
  return (
    <div
      className={
        compact
          ? "space-y-3"
          : "bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 space-y-5"
      }
    >
      {!compact && <h2 className="text-xl font-semibold">Push Details</h2>}

      <div>
        <label className="text-sm text-gray-400 mb-1 block">
          Brand URL{" "}
          <span className="text-gray-500 text-xs">
            (optional — for image search)
          </span>
        </label>
        <input
          type="text"
          value={row.brandUrl}
          onChange={(e) => onChange({ brandUrl: e.target.value })}
          placeholder="https://example.com"
          className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm"
        />
      </div>

      <LogoInput row={row} onChange={onChange} />

      <HeroInput row={row} onChange={onChange} onImageSearch={onImageSearch} />

      <div>
        <label className="text-sm text-gray-400 mb-1 block">Push Title</label>
        <input
          type="text"
          value={row.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="New drop just landed"
          maxLength={60}
          className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm"
        />
      </div>

      <div>
        <label className="text-sm text-gray-400 mb-1 block">Push Body</label>
        <textarea
          value={row.body}
          onChange={(e) => onChange({ body: e.target.value })}
          placeholder="Fresh styles just hit the shop. Tap to take a look."
          rows={3}
          maxLength={160}
          className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm"
        />
      </div>

      {/* AI Copy Assist — collapsible, secondary */}
      <div className="border border-gray-800 rounded-lg">
        <button
          type="button"
          onClick={() => onChange({ showAiCopy: !row.showAiCopy })}
          className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-400 hover:text-white"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Copy Assist (optional)
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              row.showAiCopy ? "rotate-180" : ""
            }`}
          />
        </button>
        {row.showAiCopy && (
          <div className="px-3 pb-3 space-y-2 border-t border-gray-800 pt-3">
            <p className="text-xs text-gray-500">
              Use Gemini to draft the title and body from a brand URL. Requires
              Brand URL above.
            </p>
            <button
              type="button"
              onClick={onResearch}
              disabled={row.researching || !row.brandUrl.trim()}
              className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
            >
              {row.researching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Draft copy from brand URL
            </button>
            {row.researchError && (
              <p className="text-xs text-red-400">{row.researchError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Logo input ---------------- */

interface LogoInputProps {
  row: InputRow;
  onChange: (patch: Partial<InputRow>) => void;
}

function LogoInput({ row, onChange }: LogoInputProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-gray-400">Logo</label>
        <SourceTabs
          value={row.logoSource}
          onChange={(s) => onChange({ logoSource: s })}
          options={["upload", "url"]}
        />
      </div>

      {row.logoSource === "upload" ? (
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file)
                onChange({ logoDataUrl: await fileToDataUrl(file) });
            }}
            className="flex-1 text-xs text-white file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer"
          />
          {row.logoDataUrl && (
            <button
              type="button"
              onClick={() => onChange({ logoDataUrl: "" })}
              className="text-xs text-gray-400 hover:text-red-400"
            >
              Clear
            </button>
          )}
        </div>
      ) : (
        <input
          type="text"
          value={row.logoUrl}
          onChange={(e) => onChange({ logoUrl: e.target.value })}
          placeholder="https://cdn.example.com/logo.png"
          className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm"
        />
      )}

      <div className="mt-2 flex items-center gap-3">
        <label className="text-xs text-gray-400">Icon bg</label>
        <input
          type="color"
          value={row.logoBgColor}
          onChange={(e) => onChange({ logoBgColor: e.target.value })}
          className="h-7 w-10 rounded border border-gray-800 bg-[#0f0f0f] cursor-pointer"
          title="Icon background color"
        />
        <input
          type="text"
          value={row.logoBgColor}
          onChange={(e) => onChange({ logoBgColor: e.target.value })}
          className="flex-1 px-2 py-1 bg-[#0f0f0f] border border-gray-800 rounded text-xs font-mono text-white"
        />
      </div>

      {currentLogoSrc(row) && (
        <>
          <div className="mt-2 flex items-center gap-3">
            <div
              className="h-16 w-16 rounded border border-gray-800 overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: row.logoBgColor }}
            >
              <img
                src={currentLogoSrc(row)}
                alt="Logo preview"
                className="h-full w-full object-contain"
                style={{
                  transform: `translate(${row.logoTransform.offsetX}px, ${row.logoTransform.offsetY}px) scale(${row.logoTransform.scale})`,
                  transformOrigin: "center center",
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.opacity = "0.3";
                }}
              />
            </div>
            <div className="flex-1">
              <TransformControls
                transform={row.logoTransform}
                onChange={(t) => onChange({ logoTransform: t })}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Hero input ---------------- */

interface HeroInputProps {
  row: InputRow;
  onChange: (patch: Partial<InputRow>) => void;
  onImageSearch: () => void;
}

function HeroInput({ row, onChange, onImageSearch }: HeroInputProps) {
  const canSearch = !!row.brandUrl.trim();
  const options: ImageSource[] = canSearch
    ? ["upload", "url", "search"]
    : ["upload", "url"];

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-gray-400">Hero / Push Image</label>
        <SourceTabs
          value={row.heroSource}
          onChange={(s) => onChange({ heroSource: s })}
          options={options}
        />
      </div>

      {row.heroSource === "upload" && (
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file)
                onChange({ heroDataUrl: await fileToDataUrl(file) });
            }}
            className="flex-1 text-xs text-white file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer"
          />
          {row.heroDataUrl && (
            <button
              type="button"
              onClick={() => onChange({ heroDataUrl: "" })}
              className="text-xs text-gray-400 hover:text-red-400"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {row.heroSource === "url" && (
        <input
          type="text"
          value={row.heroUrl}
          onChange={(e) => onChange({ heroUrl: e.target.value })}
          placeholder="https://cdn.example.com/hero.jpg"
          className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm"
        />
      )}

      {row.heroSource === "search" && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onImageSearch}
            disabled={row.searching || !canSearch}
            className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
          >
            {row.searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search Product Images
          </button>
          {row.searchError && (
            <p className="text-xs text-red-400">{row.searchError}</p>
          )}
          {row.searchResults.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {row.searchResults.map((url) => {
                const selected = row.heroUrl === url;
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => onChange({ heroUrl: url })}
                    className={`relative aspect-square rounded overflow-hidden border-2 ${
                      selected
                        ? "border-purple-500"
                        : "border-gray-800 hover:border-gray-600"
                    }`}
                  >
                    <img
                      src={url}
                      alt="Product"
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.opacity = "0.3";
                      }}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {currentHeroSrc(row) && (
        <div className="mt-2 flex items-start gap-3">
          <div className="h-20 w-32 rounded border border-gray-800 overflow-hidden bg-[#0f0f0f]">
            <img
              src={currentHeroSrc(row)}
              alt="Hero preview"
              className="w-full h-full object-cover"
              style={{
                transform: `translate(${row.heroTransform.offsetX}px, ${row.heroTransform.offsetY}px) scale(${row.heroTransform.scale})`,
                transformOrigin: "center center",
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.opacity = "0.3";
              }}
            />
          </div>
          <div className="flex-1">
            <TransformControls
              transform={row.heroTransform}
              onChange={(t) => onChange({ heroTransform: t })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Shared helpers ---------------- */

interface SourceTabsProps {
  value: ImageSource;
  onChange: (s: ImageSource) => void;
  options: ImageSource[];
}

function SourceTabs({ value, onChange, options }: SourceTabsProps) {
  const labels: Record<ImageSource, string> = {
    upload: "Upload",
    url: "URL",
    search: "Search",
  };
  return (
    <div className="inline-flex rounded-md bg-[#0f0f0f] border border-gray-800 overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${
            value === opt
              ? "bg-purple-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}

interface TransformControlsProps {
  transform: ImageTransform;
  onChange: (t: ImageTransform) => void;
}

function TransformControls({ transform, onChange }: TransformControlsProps) {
  const reset = () => onChange({ ...DEFAULT_TRANSFORM });
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-[11px] text-gray-400 w-10">Zoom</label>
        <input
          type="range"
          min={50}
          max={200}
          step={1}
          value={Math.round(transform.scale * 100)}
          onChange={(e) =>
            onChange({ ...transform, scale: Number(e.target.value) / 100 })
          }
          className="flex-1 accent-purple-500"
        />
        <span className="text-[11px] text-gray-400 w-10 text-right">
          {Math.round(transform.scale * 100)}%
        </span>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[11px] text-gray-400 w-10">X</label>
        <input
          type="range"
          min={-80}
          max={80}
          step={1}
          value={transform.offsetX}
          onChange={(e) =>
            onChange({ ...transform, offsetX: Number(e.target.value) })
          }
          className="flex-1 accent-purple-500"
        />
        <span className="text-[11px] text-gray-400 w-10 text-right">
          {transform.offsetX}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[11px] text-gray-400 w-10">Y</label>
        <input
          type="range"
          min={-80}
          max={80}
          step={1}
          value={transform.offsetY}
          onChange={(e) =>
            onChange({ ...transform, offsetY: Number(e.target.value) })
          }
          className="flex-1 accent-purple-500"
        />
        <span className="text-[11px] text-gray-400 w-10 text-right">
          {transform.offsetY}
        </span>
      </div>
      <button
        type="button"
        onClick={reset}
        className="text-[11px] text-gray-500 hover:text-white"
      >
        Reset
      </button>
    </div>
  );
}
