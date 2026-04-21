import { useState, useEffect, useRef } from 'react';
import { NotificationCard, type NotificationCardData } from './components/NotificationCard';
import { getBrandData, getProductImages, getFacebookProfilePicture } from './utils/contextdev';
import { selectImageAndGenerateCopy, getMessageTemplate, MESSAGE_TYPES, type MessageType } from './utils/copyGenerator';
import html2canvas from 'html2canvas';
import { Loader2, Download, Edit3, ChevronLeft, ChevronRight } from 'lucide-react';

type GeneratedCard = NotificationCardData & {
  id: string;
  domain: string;
  messageType: MessageType;
  productName?: string;
};

export default function App() {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [inputUrl, setInputUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('new-arrivals');
  const [skipCache, setSkipCache] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [error, setError] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [editingBody, setEditingBody] = useState('');
  const [editingLogo, setEditingLogo] = useState('');
  const [editingHero, setEditingHero] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<MessageType>('new-arrivals');

  const cardRef = useRef<HTMLDivElement>(null);
  const currentCard = generatedCards[currentCardIndex];

  useEffect(() => {
    if (currentCard) {
      setEditingTitle(currentCard.title);
      setEditingBody(currentCard.body);
      setEditingLogo(currentCard.logoUrl);
      setEditingHero(currentCard.heroImageUrl);
      setEditingTemplate(currentCard.messageType);
    }
  }, [currentCard]);

  const generateCards = async () => {
    const urls = mode === 'single'
      ? [inputUrl.trim()]
      : bulkUrls.split('\n').map(u => u.trim()).filter(Boolean);
    if (urls.length === 0) { setError('Please enter at least one URL'); return; }
    setIsGenerating(true);
    setError('');
    const cards: GeneratedCard[] = [];
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        if (i > 0) await new Promise(resolve => setTimeout(resolve, 2000));
        const brandData = await getBrandData(url, skipCache);
        await new Promise(resolve => setTimeout(resolve, 500));
        const products = await getProductImages(url, skipCache);
        const facebookProfilePic = getFacebookProfilePicture(brandData);
        let logoUrl: string;
        let logoMode: 'light' | 'dark' | 'has_opaque_background' = 'light';
        let selectedLogo: any = null;
        if (facebookProfilePic) {
          logoUrl = facebookProfilePic;
          logoMode = 'has_opaque_background';
        } else {
          const isValidLogoUrl = (u: string) => {
            const invalidDomains = ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com'];
            return !invalidDomains.some(domain => u.toLowerCase().includes(domain));
          };
          const validLogos = brandData.logos.filter(l => isValidLogoUrl(l.url));
          const transparentLogo = validLogos.find(l => l.type === 'icon' && (l.mode === 'light' || l.mode === 'dark'));
          const iconLogo = transparentLogo || validLogos.find(l => l.type === 'icon') || validLogos[0];
          if (!iconLogo) throw new Error('No valid logo found for brand');
          logoUrl = iconLogo.url;
          logoMode = iconLogo.mode;
          selectedLogo = iconLogo;
        }
        let iconBgColor = '#FFFFFF';
        if (selectedLogo?.colors?.length > 0) {
          iconBgColor = selectedLogo.colors[0].hex;
        } else if (brandData.colors?.length > 0) {
          if (logoMode === 'dark') iconBgColor = brandData.colors[brandData.colors.length - 1]?.hex || '#FFFFFF';
          else if (logoMode === 'has_opaque_background') iconBgColor = '#FFFFFF';
          else iconBgColor = brandData.colors[0]?.hex || '#FFFFFF';
        }
        const notificationCopy = await selectImageAndGenerateCopy(brandData, products, messageType);
        cards.push({
          id: `${url}-${Date.now()}`,
          domain: url,
          brandName: brandData.title,
          logoUrl,
          iconBgColor,
          title: notificationCopy.title,
          body: notificationCopy.body,
          heroImageUrl: notificationCopy.selectedImageUrl,
          messageType,
          productName: notificationCopy.productName,
        });
      } catch (err) {
        setError(`Failed to generate card for ${url}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    setGeneratedCards(cards);
    setCurrentCardIndex(0);
    setIsGenerating(false);
    setSkipCache(false);
  };

  const applyManualEdits = () => {
    if (!currentCard) return;
    let newTitle = editingTitle;
    let newBody = editingBody;
    if (editingTemplate !== currentCard.messageType) {
      const template = getMessageTemplate(editingTemplate, currentCard.productName);
      newTitle = template.title; newBody = template.body;
      setEditingTitle(newTitle); setEditingBody(newBody);
    }
    const updatedCards = [...generatedCards];
    updatedCards[currentCardIndex] = { ...currentCard, title: newTitle, body: newBody, logoUrl: editingLogo, heroImageUrl: editingHero, messageType: editingTemplate };
    setGeneratedCards(updatedCards);
  };

  const applyBulkEdits = () => {
    if (generatedCards.length === 0) return;
    let newTitle = editingTitle;
    let newBody = editingBody;
    if (currentCard && editingTemplate !== currentCard.messageType) {
      const template = getMessageTemplate(editingTemplate);
      newTitle = template.title; newBody = template.body;
      setEditingTitle(newTitle); setEditingBody(newBody);
    }
    setGeneratedCards(generatedCards.map(card => ({ ...card, title: newTitle, body: newBody, messageType: editingTemplate })));
  };

  const exportToPng = async (cardIndex?: number) => {
    const indexToExport = cardIndex ?? currentCardIndex;
    const card = generatedCards[indexToExport];
    if (!card || !cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#ffffff', scale: 2, useCORS: false, allowTaint: true });
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `${card.brandName.replace(/\s+/g, '-')}-notification.png`;
          a.click(); URL.revokeObjectURL(url);
        }
      });
    } catch (err) { setError(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`); }
  };

  const exportAllToPng = async () => {
    for (let i = 0; i < generatedCards.length; i++) {
      setCurrentCardIndex(i);
      await new Promise(resolve => setTimeout(resolve, 500));
      await exportToPng(i);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">Tapcart Push Mockup Generator</h1>
          <p className="text-gray-400">Generate realistic iOS push notification mockups for e-commerce brands</p>
        </div>
        <div className="flex gap-4 mb-8">
          <button onClick={() => setMode('single')} className={`px-6 py-2 rounded-lg font-medium transition-colors ${mode === 'single' ? 'bg-purple-600 text-white' : 'bg-[#1a1a1a] text-gray-400 hover:text-white'}`}>Single Mode</button>
          <button onClick={() => setMode('bulk')} className={`px-6 py-2 rounded-lg font-medium transition-colors ${mode === 'bulk' ? 'bg-purple-600 text-white' : 'bg-[#1a1a1a] text-gray-400 hover:text-white'}`}>Bulk Mode</button>
        </div>
        {generatedCards.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-xl p-8 border border-gray-800">
            <div className="mb-6">
              <label className="block">
                <span className="text-gray-300 mb-2 block">Message Type</span>
                <select value={messageType} onChange={(e) => setMessageType(e.target.value as MessageType)} className="w-full px-4 py-3 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white">
                  {MESSAGE_TYPES.map((type) => (<option key={type.value} value={type.value}>{type.label}</option>))}
                </select>
              </label>
            </div>
            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={skipCache} onChange={(e) => setSkipCache(e.target.checked)} className="w-4 h-4 bg-[#0f0f0f] border border-gray-800 rounded" />
                <span className="text-sm text-gray-300">Refresh cache (fetch fresh data from Context.dev)</span>
              </label>
            </div>
            {mode === 'single' ? (
              <div className="space-y-4">
                <label className="block">
                  <span className="text-gray-300 mb-2 block">Brand URL</span>
                  <input type="text" value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} placeholder="https://example.com" className="w-full px-4 py-3 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white" />
                </label>
                <button onClick={generateCards} disabled={isGenerating} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2">
                  {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isGenerating ? 'Generating...' : 'Generate Notification'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block">
                  <span className="text-gray-300 mb-2 block">Brand URLs (one per line)</span>
                  <textarea value={bulkUrls} onChange={(e) => setBulkUrls(e.target.value)} placeholder={"https://example1.com\nhttps://example2.com"} rows={8} className="w-full px-4 py-3 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white font-mono text-sm" />
                </label>
                <button onClick={generateCards} disabled={isGenerating} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2">
                  {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isGenerating ? 'Generating All...' : 'Generate All Notifications'}
                </button>
              </div>
            )}
            {error && <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">{error}</div>}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Preview</h2>
                  <div className="flex items-center gap-2">
                    {generatedCards.length > 1 && (
                      <>
                        <button onClick={() => setCurrentCardIndex(Math.max(0, currentCardIndex - 1))} disabled={currentCardIndex === 0} className="p-2 bg-[#0f0f0f] hover:bg-gray-800 disabled:opacity-50 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
                        <span className="text-sm text-gray-400">{currentCardIndex + 1} / {generatedCards.length}</span>
                        <button onClick={() => setCurrentCardIndex(Math.min(generatedCards.length - 1, currentCardIndex + 1))} disabled={currentCardIndex === generatedCards.length - 1} className="p-2 bg-[#0f0f0f] hover:bg-gray-800 disabled:opacity-50 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex justify-center">{currentCard && <NotificationCard ref={cardRef} data={currentCard} />}</div>
                <div className="flex gap-2 mt-6">
                  <button onClick={() => exportToPng()} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium flex items-center justify-center gap-2"><Download className="w-4 h-4" />Export PNG</button>
                  {mode === 'bulk' && generatedCards.length > 1 && (
                    <button onClick={exportAllToPng} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium flex items-center justify-center gap-2"><Download className="w-4 h-4" />Export All</button>
                  )}
                </div>
              </div>
              <button onClick={() => setGeneratedCards([])} className="w-full px-4 py-2 bg-[#1a1a1a] hover:bg-gray-800 border border-gray-800 rounded-lg font-medium">Start New</button>
            </div>
            <div className="space-y-6">
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <Edit3 className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-semibold">{mode === 'bulk' ? 'Bulk Editing (applies to all)' : 'Editing'}</h2>
                </div>
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm text-gray-400 mb-1 block">Message Template</span>
                    <select value={editingTemplate} onChange={(e) => setEditingTemplate(e.target.value as MessageType)} className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm">
                      {MESSAGE_TYPES.map((type) => (<option key={type.value} value={type.value}>{type.label}</option>))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-400 mb-1 block">Title</span>
                    <input type="text" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-400 mb-1 block">Body</span>
                    <textarea value={editingBody} onChange={(e) => setEditingBody(e.target.value)} rows={3} className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm" />
                  </label>
                  {mode === 'single' && (
                    <>
                      <label className="block">
                        <span className="text-sm text-gray-400 mb-1 block">Logo Image</span>
                        <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => setEditingLogo(ev.target?.result as string); reader.readAsDataURL(file); }}} className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer" />
                      </label>
                      <label className="block">
                        <span className="text-sm text-gray-400 mb-1 block">Hero Image</span>
                        <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => setEditingHero(ev.target?.result as string); reader.readAsDataURL(file); }}} className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer" />
                      </label>
                    </>
                  )}
                  <button onClick={mode === 'bulk' ? applyBulkEdits : applyManualEdits} className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium">{mode === 'bulk' ? 'Apply to All Cards' : 'Apply Changes'}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
