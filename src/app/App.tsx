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
  Settings as SettingsIcon,
  X,
  Smile,
} from "lucide-react";
import Picker from "@emoji-mart/react";
import emojiData from "@emoji-mart/data";
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
  getGeminiApiKey,
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

function insertAtCursor(
  field: HTMLInputElement | HTMLTextAreaElement | null,
  current: string,
  text: string
): string {
  if (!field) return current + text;
  const start = field.selectionStart ?? current.length;
  const end = field.selectionEnd ?? current.length;
  return current.slice(0, start) + text + current.slice(end);
}

export default function App() {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [singleRow, setSingleRow] = useState<InputRow>(emptyRow());
  const [bulkRows, setBulkRows] = useState<InputRow[]>([emptyRow()]);
  const [bulkPreviewIndex, setBulkPreviewIndex] = useState(0);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKeyPresent, setApiKeyPresent] = useState<boolean>(() =>
    Boolean(getGeminiApiKey())
  );

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

  const refreshApiKeyIndicator = () => {
    setApiKeyPresent(Boolean(getGeminiApiKey()));
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
              Tapcart Push Mockup Generator
            </h1>
            <p className="text-gray-400">
              Build pixel-perfect iOS push notification previews. Single or bulk.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {!apiKeyPresent && (
              <div className="flex items-center gap-1.5 text-xs text-yellow-400">
                <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                <span>API key not set</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg bg-[#1a1a1a] border border-gray-800 hover:text-white text-gray-400"
              title="Settings"
              aria-label="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
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

      {settingsOpen && (
        <SettingsModal
          onClose={() => {
            setSettingsOpen(false);
            refreshApiKeyIndicator();
          }}
          onChange={refreshApiKeyIndicator}
        />
      )}
    </div>
  );
}

/* ---------------- Settings modal ---------------- */

interface SettingsModalProps {
  onClose: () => void;
  onChange: () => void;
}

function SettingsModal({ onClose, onChange }: SettingsModalProps) {
  const [value, setValue] = useState<string>(() => {
    try {
      return localStorage.getItem("gemini_api_key") || "";
    } catch {
      return "";
    }
  });
  const [saved, setSaved] = useState(false);

  const save = () => {
    try {
      localStorage.setItem("gemini_api_key", value.trim());
      setSaved(true);
      onChange();
      setTimeout(() => setSaved(false), 1200);
    } catch {
      /* ignore */
    }
  };

  const clear = () => {
    try {
      localStorage.removeItem("gemini_api_key");
      setValue("");
      onChange();
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl bg-[#1a1a1a] border border-gray-800 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold mb-4">Settings</h2>
        <label className="text-sm text-gray-400 mb-1 block">
          Gemini API Key
        </label>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="AIza..."
          className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm font-mono"
        />
        <p className="mt-2 text-xs text-gray-500">
          Stored locally in your browser. Never sent to any server except Gemini.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={save}
            className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium"
          >
            {saved ? "Saved" : "Save"}
          </button>
          <button
            type="button"
            onClick={clear}
            className="px-3 py-2 bg-[#0f0f0f] border border-gray-800 hover:bg-gray-900 rounded-lg text-sm font-medium text-gray-300"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Emoji popover ---------------- */

interface EmojiPopoverProps {
  onPick: (emoji: string) => void;
}

function EmojiPopover({ onPick }: EmojiPopoverProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1 text-gray-400 hover:text-white"
        aria-label="Insert emoji"
        title="Insert emoji"
      >
        <Smile className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute z-40 mt-1 right-0 shadow-xl">
          <Picker
            data={emojiData}
            theme="dark"
            previewPosition="none"
            onEmojiSelect={(e: { native?: string }) => {
              if (e?.native) {
                onPick(e.native);
                setOpen(false);
              }
            }}
          />
        </div>
      )}
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
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div
      className={
        compact
          ? "space-y-3"
          : "bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 space-y-5"
      }
    >
      {!compact && <h2 className="text-xl font-semibold">Push Details</h2>}

      <LogoInput row={row} onChange={onChange} />

      <HeroInput
        row={row}
        onChange={onChange}
        onImageSearch={onImageSearch}
        onBrandUrlChange={(url) => onChange({ brandUrl: url })}
        brandUrl={row.brandUrl}
      />

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm text-gray-400">Push Title</label>
          <EmojiPopover
            onPick={(emoji) =>
              onChange({
                title: insertAtCursor(titleRef.current, row.title, emoji),
              })
            }
          />
        </div>
        <input
          ref={titleRef}
          type="text"
          value={row.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="New drop just landed"
          maxLength={60}
          className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm text-gray-400">Push Body</label>
          <EmojiPopover
            onPick={(emoji) =>
              onChange({
                body: insertAtCursor(bodyRef.current, row.body, emoji),
              })
            }
          />
        </div>
        <textarea
          ref={bodyRef}
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
              Use Gemini to draft the title and body from the Brand URL in the
              Hero Image section above.
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

/* ---------------- Hero input (with Brand URL + Search) ---------------- */

interface HeroInputProps {
  row: InputRow;
  onChange: (patch: Partial<InputRow>) => void;
  onImageSearch: () => void;
  brandUrl: string;
  onBrandUrlChange: (url: string) => void;
}

function HeroInput({
  row,
  onChange,
  onImageSearch,
  brandUrl,
  onBrandUrlChange,
}: HeroInputProps) {
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  const handleHeroFile = async (file: File | undefined) => {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    onChange({ heroDataUrl: dataUrl, heroSource: "upload" });
  };

  const heroSrc = currentHeroSrc(row);

  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-400 block">Hero Image</label>

      <SourceTabs
        value={row.heroSource}
        onChange={(src) => onChange({ heroSource: src })}
        showSearch
      />

      {row.heroSource === "upload" && (
        <div>
          <input
            ref={heroFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleHeroFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => heroFileInputRef.current?.click()}
            className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg text-sm text-gray-300 hover:bg-gray-900"
          >
            {row.heroDataUrl ? "Change image" : "Upload image"}
          </button>
        </div>
      )}

      {row.heroSource === "url" && (
        <input
          type="url"
          value={row.heroUrl}
          onChange={(e) => onChange({ heroUrl: e.target.value })}
          placeholder="https://cdn.example.com/hero.jpg"
          className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm"
        />
      )}

      {row.heroSource === "search" && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Brand URL
            </label>
            <input
              type="url"
              value={brandUrl}
              onChange={(e) => onBrandUrlChange(e.target.value)}
              placeholder="https://yourbrand.com"
              className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm"
            />
          </div>
          <button
            type="button"
            onClick={onImageSearch}
            disabled={row.searching || !brandUrl.trim()}
            className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
          >
            {row.searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search product images
          </button>
          {row.searchError && (
            <p className="text-xs text-red-400">{row.searchError}</p>
          )}
          {row.searchResults.length > 0 && (
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1 border border-gray-800 rounded-lg">
              {row.searchResults.map((url) => {
                const selected = row.heroUrl === url;
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() =>
                      onChange({
                        heroUrl: url,
                        heroTransform: { ...DEFAULT_TRANSFORM },
                      })
                    }
                    className={`relative aspect-square rounded overflow-hidden border-2 ${
                      selected
                        ? "border-purple-500"
                        : "border-transparent hover:border-gray-600"
                    }`}
                  >
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      loading="lazy"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {heroSrc && (
        <>
          <HeroThumb src={heroSrc} transform={row.heroTransform} />
          <TransformControls
            label="Hero"
            transform={row.heroTransform}
            onChange={(t) => onChange({ heroTransform: t })}
          />
        </>
      )}
    </div>
  );
}

function HeroThumb({
  src,
  transform,
}: {
  src: string;
  transform: ImageTransform;
}) {
  return (
    <div className="w-full aspect-[375/270] overflow-hidden rounded-lg bg-gray-900 border border-gray-800">
      <img
        src={src}
        alt="hero preview"
        crossOrigin="anonymous"
        className="w-full h-full object-cover"
        style={{
          objectPosition: `${transform.offsetX}% ${transform.offsetY}%`,
          transform: `scale(${transform.scale})`,
          transformOrigin: `${transform.offsetX}% ${transform.offsetY}%`,
        }}
      />
    </div>
  );
}

/* ---------------- Logo input ---------------- */

interface LogoInputProps {
  row: InputRow;
  onChange: (patch: Partial<InputRow>) => void;
}

function LogoInput({ row, onChange }: LogoInputProps) {
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFile = async (file: File | undefined) => {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    onChange({ logoDataUrl: dataUrl, logoSource: "upload" });
  };

  const logoSrc = currentLogoSrc(row);

  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-400 block">Brand Logo</label>

      <SourceTabs
        value={row.logoSource}
        onChange={(src) => onChange({ logoSource: src })}
      />

      {row.logoSource === "upload" ? (
        <div>
          <input
            ref={logoFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleLogoFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => logoFileInputRef.current?.click()}
            className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg text-sm text-gray-300 hover:bg-gray-900"
          >
            {row.logoDataUrl ? "Change logo" : "Upload logo"}
          </button>
        </div>
      ) : (
        <input
          type="url"
          value={row.logoUrl}
          onChange={(e) => onChange({ logoUrl: e.target.value })}
          placeholder="https://cdn.example.com/logo.png"
          className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm"
        />
      )}

      {logoSrc && (
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg overflow-hidden border border-gray-800 shrink-0"
            style={{ backgroundColor: row.logoBgColor }}
          >
            <img
              src={logoSrc}
              alt="logo preview"
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
              style={{
                objectPosition: `${row.logoTransform.offsetX}% ${row.logoTransform.offsetY}%`,
                transform: `scale(${row.logoTransform.scale})`,
                transformOrigin: `${row.logoTransform.offsetX}% ${row.logoTransform.offsetY}%`,
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Bg</label>
            <input
              type="color"
              value={row.logoBgColor}
              onChange={(e) => onChange({ logoBgColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border border-gray-800"
            />
          </div>
        </div>
      )}

      {logoSrc && (
        <TransformControls
          label="Logo"
          transform={row.logoTransform}
          onChange={(t) => onChange({ logoTransform: t })}
        />
      )}
    </div>
  );
}

/* ---------------- Source tabs ---------------- */

interface SourceTabsProps {
  value: ImageSource;
  onChange: (src: ImageSource) => void;
  showSearch?: boolean;
}

function SourceTabs({ value, onChange, showSearch }: SourceTabsProps) {
  const tabs: { id: ImageSource; label: string }[] = [
    { id: "upload", label: "Upload" },
    { id: "url", label: "URL" },
  ];
  if (showSearch) tabs.push({ id: "search", label: "Search" });

  return (
    <div className="flex gap-1 p-1 bg-[#0f0f0f] border border-gray-800 rounded-lg">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`flex-1 px-2 py-1 rounded text-xs font-medium ${
            value === t.id
              ? "bg-purple-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Transform controls ---------------- */

interface TransformControlsProps {
  label: string;
  transform: ImageTransform;
  onChange: (t: ImageTransform) => void;
}

function TransformControls({
  label,
  transform,
  onChange,
}: TransformControlsProps) {
  const reset = () => onChange({ ...DEFAULT_TRANSFORM });

  return (
    <details className="border border-gray-800 rounded-lg">
      <summary className="cursor-pointer px-3 py-2 text-xs text-gray-400 select-none">
        {label} image position & zoom
      </summary>
      <div className="p-3 space-y-2">
        <Slider
          label="Pan X"
          min={0}
          max={100}
          value={transform.offsetX}
          onChange={(v) => onChange({ ...transform, offsetX: v })}
          suffix="%"
        />
        <Slider
          label="Pan Y"
          min={0}
          max={100}
          value={transform.offsetY}
          onChange={(v) => onChange({ ...transform, offsetY: v })}
          suffix="%"
        />
        <Slider
          label="Zoom"
          min={100}
          max={300}
          value={Math.round(transform.scale * 100)}
          onChange={(v) => onChange({ ...transform, scale: v / 100 })}
          suffix="%"
        />
        <button
          type="button"
          onClick={reset}
          className="text-xs text-gray-500 hover:text-white"
        >
          Reset
        </button>
      </div>
    </details>
  );
}

function Slider({
  label,
  min,
  max,
  value,
  onChange,
  suffix,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between text-xs text-gray-400 mb-0.5">
        <span>{label}</span>
        <span>
          {value}
          {suffix ?? ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-purple-600"
      />
    </label>
  );
}
