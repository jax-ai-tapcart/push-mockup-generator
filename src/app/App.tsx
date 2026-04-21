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
  const [inputUrl, setInputUrl] = useState(''  );
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
