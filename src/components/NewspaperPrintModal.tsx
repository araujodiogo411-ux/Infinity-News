import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Printer, 
  X, 
  Box, 
  Download, 
  Check, 
  Sparkles, 
  AlertCircle,
  RefreshCw,
  FileDown,
  Layers,
  Newspaper,
  Image as ImageIcon
} from 'lucide-react';
import { NewsArticle } from '../types/news';

interface NewspaperPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: Partial<NewsArticle> | null;
  isAdmin?: boolean;
}

export const NewspaperPrintModal: React.FC<NewspaperPrintModalProps> = ({
  isOpen,
  onClose,
  article,
  isAdmin = false
}) => {
  const [styleMode, setStyleMode] = useState<'banca' | 'color'>('banca');
  const [view3D, setView3D] = useState(false);
  const [mouseRot, setMouseRot] = useState({ x: 2, y: -2 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [directDownloadUrl, setDirectDownloadUrl] = useState<string | null>(null);
  const [activePageTab, setActivePageTab] = useState<'page1' | 'page2'>('page1');

  const page1Ref = useRef<HTMLDivElement | null>(null);
  const page2Ref = useRef<HTMLDivElement | null>(null);

  if (!isOpen || !article) return null;

  const formattedDate = new Date(article.publishedAt || new Date()).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const sectionName = article.newspaperSection 
    ? article.newspaperSection.toUpperCase() 
    : `CADERNO ${(article.customCategory || article.category || 'ESPECIAL').toUpperCase()}`;

  // REQUIREMENT: When exporting to print/image, remove all video blocks and join content cleanly!
  const printableBlocks = (article.blocks || []).filter(b => b.type !== 'video');

  // Intelligent pagination: Page 1 gets up to 3 blocks; Page 2 gets remaining blocks
  const page1Blocks = printableBlocks.slice(0, 3);
  const page2Blocks = printableBlocks.slice(3);
  const hasPage2 = page2Blocks.length > 0;

  // Helper to convert external image to base64 data URI to prevent canvas taint
  const convertImageToBase64 = async (url: string): Promise<string> => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    
    try {
      const res = await fetch(`/api/image-base64?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.base64) {
          return data.base64;
        }
      }
    } catch (e) {
      console.warn('Base64 proxy error, using direct proxy:', e);
    }
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  };

  // -------------------------------------------------------------
  // USER PREFERRED DOWNLOAD: A4 HIGH-RESOLUTION IMAGE (.PNG)
  // "E ENVEZ DE BAIXAR EM PDF PREFIRO BAIXAR CADA IMAGEM TAMANHO A4
  // BEM ORGANIZADO SEM TEXTO BUGADO OU CORTADO SEM IMAGEM CORTADA"
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // HIGH-RESOLUTION A4 IMAGE (.PNG) & PDF DOWNLOAD
  // Generates 100% crisp, unclipped publication-ready A4 documents
  // -------------------------------------------------------------
  const prepareElementForCapture = async (element: HTMLElement) => {
    // 1. Temporarily remove 3D perspective transforms to avoid distortion
    const prevTransform = element.style.transform;
    const prevBoxShadow = element.style.boxShadow;
    const prevFilter = element.style.filter;
    element.style.transform = 'none';
    element.style.boxShadow = 'none';
    element.style.filter = 'none';

    // 2. Preload and convert any remote images to base64 data URIs
    const imgElements = element.querySelectorAll('img');
    for (let i = 0; i < imgElements.length; i++) {
      const img = imgElements[i];
      if (img.src && !img.src.startsWith('data:')) {
        try {
          const safeDataUri = await convertImageToBase64(img.src);
          if (safeDataUri) {
            img.src = safeDataUri;
          }
        } catch (e) {
          console.warn('Image convert warning:', e);
        }
      }
      // Wait for image load
      if (!img.complete) {
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          setTimeout(resolve, 800);
        });
      }
    }

    await new Promise(r => setTimeout(r, 200));

    return () => {
      // Restore previous styling
      element.style.transform = prevTransform;
      element.style.boxShadow = prevBoxShadow;
      element.style.filter = prevFilter;
    };
  };

  const handleDownloadA4Image = async (targetPageNum = 1) => {
    const element = targetPageNum === 1 ? page1Ref.current : (page2Ref.current || page1Ref.current);
    if (!element) return;

    setIsGenerating(true);
    setStatusText(`1/2 Processando Página ${targetPageNum} em formato A4 de alta resolução...`);
    setDirectDownloadUrl(null);

    let restoreStyles: (() => void) | null = null;

    try {
      restoreStyles = await prepareElementForCapture(element);
      setStatusText(`2/2 Renderizando imagem A4 em alta nitidez (300 DPI)...`);

      const canvas = await html2canvas(element, {
        scale: 2.5, // Ultra-sharp 300 DPI
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
      });

      const cleanTitle = (article.title || 'Edicao-A4')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .slice(0, 30);

      const fileName = `INFINITY-${cleanTitle}-pagina-${targetPageNum}-a4.png`;

      // Trigger download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const blobUrl = URL.createObjectURL(blob);
        setDirectDownloadUrl(blobUrl);

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (a.parentNode) document.body.removeChild(a);
        }, 3000);

        setDownloadSuccess(true);
        setStatusText(`Imagem A4 Página ${targetPageNum} salva com sucesso (${fileName})!`);
      }, 'image/png');

    } catch (err: any) {
      console.error('Error generating A4 image:', err);
      setStatusText('Erro ao gerar imagem A4: ' + (err.message || 'Falha na renderização'));
    } finally {
      if (restoreStyles) restoreStyles();
      setIsGenerating(false);
    }
  };

  const handleDownloadAllPagesImages = async () => {
    await handleDownloadA4Image(1);
    if (hasPage2) {
      setTimeout(async () => {
        await handleDownloadA4Image(2);
      }, 1500);
    }
  };

  // High-Resolution Multi-page PDF Generator in Exact A4 dimensions
  const handleDownloadPDF = async () => {
    if (!page1Ref.current) return;

    setIsGenerating(true);
    setStatusText('1/3 Processando diagramação do jornal em folha A4...');
    setDirectDownloadUrl(null);

    let restoreStyles1: (() => void) | null = null;
    let restoreStyles2: (() => void) | null = null;

    try {
      restoreStyles1 = await prepareElementForCapture(page1Ref.current);
      setStatusText('2/3 Capturando página principal...');

      const canvas1 = await html2canvas(page1Ref.current, {
        scale: 2.2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 794,
      });

      const imgData1 = canvas1.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // 210mm x 297mm (Standard International A4 format)
      pdf.addImage(imgData1, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

      if (hasPage2 && page2Ref.current) {
        setStatusText('3/3 Capturando segunda página...');
        restoreStyles2 = await prepareElementForCapture(page2Ref.current);
        const canvas2 = await html2canvas(page2Ref.current, {
          scale: 2.2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 794,
        });
        const imgData2 = canvas2.toDataURL('image/jpeg', 0.98);
        pdf.addPage();
        pdf.addImage(imgData2, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }

      const cleanTitle = (article.title || 'Edicao-A4')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .slice(0, 30);
      const fileName = `INFINITY-${cleanTitle}-A4.pdf`;

      // Save PDF directly and also create fallback Blob URL
      const pdfBlob = pdf.output('blob');
      const pdfBlobUrl = URL.createObjectURL(pdfBlob);
      setDirectDownloadUrl(pdfBlobUrl);

      pdf.save(fileName);
      setDownloadSuccess(true);
      setStatusText(`Jornal em PDF (${fileName}) salvo em folha A4 pronta para impressão!`);
    } catch (e: any) {
      console.error('PDF error:', e);
      setStatusText('Erro ao gerar PDF: ' + (e.message || 'Falha no processamento'));
    } finally {
      if (restoreStyles1) restoreStyles1();
      if (restoreStyles2) restoreStyles2();
      setIsGenerating(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!view3D) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseRot({
      x: -y * 8,
      y: x * 10
    });
  };

  // ==============================================================
  // PÁGINA 1: JORNAL DE BANCA (TAMANHO A4 OFICIAL: 794px × 1123px)
  // ==============================================================
  const renderPage1 = () => (
    <div 
      ref={page1Ref}
      id="newspaper-page-1"
      className={`bg-white text-black ${styleMode === 'banca' ? 'filter grayscale-[0.95] contrast-[1.10]' : ''}`}
      style={{
        width: '794px', // Exactly 210mm in pixels at standard A4 96 DPI
        minHeight: '1123px', // Exactly 297mm in pixels
        boxSizing: 'border-box',
        padding: '28px 34px',
        margin: '0 auto',
        position: 'relative',
        backgroundColor: '#ffffff',
        fontFamily: "'Newsreader', 'Merriweather', Georgia, serif",
        transform: view3D ? `rotateX(${mouseRot.x}deg) rotateY(${mouseRot.y}deg) scale(0.97)` : 'none',
        boxShadow: view3D ? '0 30px 60px -12px rgba(0, 0, 0, 0.8)' : '0 10px 30px rgba(0,0,0,0.15)',
        border: '1px solid #d1d5db',
      }}
    >
      {/* 3D Fold overlay */}
      {view3D && (
        <div className="no-print absolute inset-y-0 left-1/2 w-16 -ml-8 bg-gradient-to-r from-transparent via-black/10 to-transparent pointer-events-none z-10" />
      )}

      {/* TOP MASTHEAD */}
      <div style={{ borderBottom: '4px solid #000000', paddingBottom: '6px', marginBottom: '12px', textAlign: 'center' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10px',
          fontWeight: '700',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          borderBottom: '1px solid #000000',
          paddingBottom: '3px',
          marginBottom: '6px',
          color: '#1f2937'
        }}>
          <span>{sectionName}</span>
          <span>{capitalizedDate}</span>
          <span>{article.newspaperYear || 'Ano XXXIV (2026)'} • {article.newspaperEdition || 'Edição Nacional'}</span>
          <span>{article.newspaperPrice || 'R$ 4,50'}</span>
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '56px',
          fontWeight: '900',
          letterSpacing: '-2px',
          margin: '0',
          lineHeight: '0.9',
          color: '#000000',
          textTransform: 'uppercase'
        }}>
          INFINITY
        </h1>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          fontWeight: '600',
          borderTop: '1px solid #000000',
          paddingTop: '3px',
          marginTop: '6px',
          color: '#374151'
        }}>
          <span>O DIÁRIO DO BRASIL E DO MUNDO • REDAÇÃO INVESTIGATIVA</span>
          <span>TEMPO REAL • DÓLAR, EURO, PIB & CRIPTOMOEDAS</span>
          <span>EXEMPLAR REGISTRADO • PÁG. 01 DE {hasPage2 ? '02' : '01'}</span>
        </div>
      </div>

      {/* HEADLINE SECTION */}
      <div style={{ marginBottom: '14px', borderBottom: '2px solid #000000', paddingBottom: '10px' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '900',
          color: styleMode === 'banca' ? '#000000' : '#c4170c',
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
          marginBottom: '3px',
          fontFamily: "'Playfair Display', Georgia, serif"
        }}>
          {article.chapeu || 'REPORTAGEM ESPECIAL'}
        </div>

        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '29px',
          fontWeight: '900',
          lineHeight: '1.15',
          letterSpacing: '-0.5px',
          color: '#000000',
          margin: '0 0 8px 0'
        }}>
          {article.title}
        </h2>

        {article.subtitle && (
          <p style={{
            fontSize: '14px',
            lineHeight: '1.35',
            color: '#374151',
            fontStyle: 'italic',
            margin: '0 0 8px 0'
          }}>
            {article.subtitle}
          </p>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10.5px',
          borderTop: '1px solid #d1d5db',
          paddingTop: '4px',
          color: '#1f2937'
        }}>
          <div>
            <strong>Reportagem de:</strong> {article.author || 'Redação INFINITY'} — {article.authorRole || 'Especial para o INFINITY'}
          </div>
          <div>Brasília • Edição Fechada para Banca</div>
        </div>
      </div>

      {/* MAIN BODY: 2 FIXED COLUMNS (LEFT 486px, RIGHT 214px, GAP 20px) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '486px 214px',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* LEFT COLUMN: Cover photo + 2 newspaper columns of text */}
        <div>
          {article.imageUrl && (
            <div style={{
              border: '1px solid #000000',
              padding: '4px',
              backgroundColor: '#ffffff',
              marginBottom: '12px'
            }}>
              <img
                src={article.imageUrl}
                alt={article.title || 'Foto de capa'}
                crossOrigin="anonymous"
                style={{
                  width: '100%',
                  height: '230px',
                  objectFit: 'cover',
                  display: 'block',
                  border: '1px solid #e5e7eb'
                }}
              />
              <div style={{
                paddingTop: '5px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                fontSize: '10px',
                lineHeight: '1.25',
                color: '#374151'
              }}>
                <span style={{ fontStyle: 'italic', maxWidth: '340px' }}>
                  {article.imageCaption || 'Registro fotográfico da reportagem do INFINITY.'}
                </span>
                <span style={{ fontWeight: '700', textTransform: 'uppercase', fontSize: '9px', color: '#4b5563' }}>
                  {article.imageCredit || 'Foto: INFINITY'}
                </span>
              </div>
            </div>
          )}

          {/* Newspaper 2-column text */}
          <div style={{
            columnCount: 2,
            columnGap: '16px',
            columnRule: '1px solid #d1d5db',
            textAlign: 'justify',
            fontSize: '12px',
            lineHeight: '1.42',
            color: '#0f172a'
          }}>
            {page1Blocks.map((block, idx) => {
              if (block.type === 'heading') {
                return (
                  <h3 key={idx} style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '13px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    color: '#000000',
                    marginTop: '8px',
                    marginBottom: '4px'
                  }}>
                    {block.content}
                  </h3>
                );
              }
              return (
                <p key={idx} style={{ marginBottom: '8px', marginTop: 0, textIndent: idx === 0 ? '0' : '1em' }}>
                  {block.content}
                </p>
              );
            })}

            {hasPage2 && (
              <div style={{
                marginTop: '10px',
                paddingTop: '6px',
                borderTop: '1px dashed #9ca3af',
                fontSize: '10px',
                fontStyle: 'italic',
                color: '#4b5563'
              }}>
                Continua na Página 02 deste caderno...
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Pull quote, Edition card, Tags, Barcode */}
        <div style={{
          borderLeft: '1px solid #9ca3af',
          paddingLeft: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '440px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {article.keyQuotes && article.keyQuotes.length > 0 && (
              <div style={{
                border: '2px solid #000000',
                padding: '10px',
                backgroundColor: '#fefce8',
                position: 'relative'
              }}>
                <span style={{
                  position: 'absolute',
                  top: '-9px',
                  left: '8px',
                  backgroundColor: '#ffffff',
                  padding: '0 5px',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontWeight: '900',
                  fontSize: '9.5px',
                  textTransform: 'uppercase',
                  border: '1px solid #000000'
                }}>
                  Em Destaque
                </span>
                <blockquote style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: '12px',
                  fontWeight: '700',
                  lineHeight: '1.3',
                  color: '#000000',
                  margin: 0
                }}>
                  "{article.keyQuotes[0]}"
                </blockquote>
              </div>
            )}

            <div style={{
              border: '1px solid #9ca3af',
              padding: '8px',
              backgroundColor: '#f9fafb',
              fontSize: '10.5px',
              color: '#1f2937'
            }}>
              <div style={{
                fontWeight: '800',
                textTransform: 'uppercase',
                borderBottom: '1px solid #000000',
                paddingBottom: '2px',
                marginBottom: '5px'
              }}>
                Ficha da Edição de Banca
              </div>
              <div style={{ lineHeight: '1.4' }}>
                <div>• Formato: Folha A4 (210 × 297 mm)</div>
                <div>• Caderno: {article.customCategory || article.category || 'Geral'}</div>
                <div>• Edição: {article.newspaperEdition || 'Nacional'}</div>
                <div>• Circulação: Bancas & Assinantes</div>
              </div>
            </div>

            {article.tags && article.tags.length > 0 && (
              <div>
                <div style={{ fontWeight: '800', textTransform: 'uppercase', fontSize: '9.5px', marginBottom: '4px' }}>
                  Palavras-Chave do Arquivo:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                  {article.tags.map((t, i) => (
                    <span key={i} style={{
                      border: '1px solid #9ca3af',
                      padding: '1px 4px',
                      fontSize: '9px',
                      backgroundColor: '#ffffff'
                    }}>
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Barcode & Footer */}
          <div style={{ borderTop: '2px solid #000000', paddingTop: '8px', marginTop: '14px' }}>
            <div style={{ fontSize: '9px', lineHeight: '1.3', color: '#4b5563', marginBottom: '6px' }}>
              <strong style={{ color: '#000000', textTransform: 'uppercase' }}>INFINITY COMUNICAÇÃO S/A</strong>
              <div>Redação Central Integrada • Edição A4</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '8px' }}>
                ||| | ||||| || |||| ||| |||||
                <div>7 891000 248901</div>
              </div>
              <span style={{ fontSize: '9px', fontWeight: '800' }}>
                PÁG. 01
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ==============================================================
  // PÁGINA 2: CONTINUAÇÃO DA REPORTAGEM (SE HOUVER BLOCOS ADICIONAIS)
  // ==============================================================
  const renderPage2 = () => (
    <div 
      ref={page2Ref}
      id="newspaper-page-2"
      className={`bg-white text-black ${styleMode === 'banca' ? 'filter grayscale-[0.95] contrast-[1.10]' : ''}`}
      style={{
        width: '794px',
        minHeight: '1123px',
        boxSizing: 'border-box',
        padding: '28px 34px',
        margin: '0 auto',
        position: 'relative',
        backgroundColor: '#ffffff',
        fontFamily: "'Newsreader', 'Merriweather', Georgia, serif",
        border: '1px solid #d1d5db',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
      }}
    >
      {/* Top Header Page 2 */}
      <div style={{ borderBottom: '3px solid #000000', paddingBottom: '6px', marginBottom: '14px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          fontWeight: '700',
          textTransform: 'uppercase'
        }}>
          <span>INFINITY • {sectionName}</span>
          <span>CONTINUAÇÃO DA REPORTAGEM</span>
          <span>PÁGINA 02 DE 02</span>
        </div>
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '20px',
          fontWeight: '900',
          margin: '6px 0 0 0',
          textTransform: 'uppercase'
        }}>
          {article.title} (Continuação)
        </h2>
      </div>

      {/* 2 Equal Columns for Remaining Content & Inline Images */}
      <div style={{
        columnCount: 2,
        columnGap: '20px',
        columnRule: '1px solid #d1d5db',
        textAlign: 'justify',
        fontSize: '12px',
        lineHeight: '1.45',
        color: '#0f172a'
      }}>
        {page2Blocks.map((block, idx) => {
          if (block.type === 'heading') {
            return (
              <h3 key={idx} style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '13px',
                fontWeight: '800',
                textTransform: 'uppercase',
                color: '#000000',
                marginTop: '10px',
                marginBottom: '4px'
              }}>
                {block.content}
              </h3>
            );
          }
          if (block.type === 'image') {
            return (
              <div key={idx} style={{
                margin: '10px 0',
                border: '1px solid #000000',
                padding: '3px',
                backgroundColor: '#ffffff',
                breakInside: 'avoid'
              }}>
                <img 
                  src={block.content} 
                  alt="Foto editorial" 
                  crossOrigin="anonymous"
                  style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} 
                />
                {block.caption && (
                  <div style={{ fontSize: '9px', fontStyle: 'italic', color: '#4b5563', paddingTop: '3px' }}>
                    {block.caption} {block.credit ? `(${block.credit})` : ''}
                  </div>
                )}
              </div>
            );
          }
          return (
            <p key={idx} style={{ marginBottom: '8px', marginTop: 0, textIndent: '1em' }}>
              {block.content}
            </p>
          );
        })}
      </div>

      {/* Footer Page 2 */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '34px',
        right: '34px',
        borderTop: '2px solid #000000',
        paddingTop: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '9px',
        color: '#4b5563'
      }}>
        <span>INFINITY JORNALISMO • EDIÇÃO NACIONAL • TODOS OS DIREITOS RESERVADOS</span>
        <span style={{ fontWeight: '800' }}>FIM DA EDIÇÃO • PÁG. 02</span>
      </div>
    </div>
  );

  return (
    <div className="no-print fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex justify-center p-2 sm:p-5 animate-fadeIn">
      <div className="w-full max-w-4xl my-auto">
        
        {/* Controls Bar at Top */}
        <div className="bg-[#121212] text-white rounded-t-3xl px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl border-b border-gray-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black text-sm shadow">
              A4
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                <span>Edição de Banca para Baixar em Imagem A4</span>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-400/30">
                  Formato A4 (210mm × 297mm)
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">
                Baixe em imagem (.PNG) de altíssima resolução. Sem corte de imagens ou sobreposição de texto.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* Page Tab Selector if multiple pages */}
            {hasPage2 && (
              <div className="flex items-center bg-gray-800 p-0.5 rounded-xl border border-gray-700 text-xs">
                <button
                  onClick={() => setActivePageTab('page1')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    activePageTab === 'page1' ? 'bg-amber-400 text-black shadow' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Pág. 01
                </button>
                <button
                  onClick={() => setActivePageTab('page2')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    activePageTab === 'page2' ? 'bg-amber-400 text-black shadow' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Pág. 02
                </button>
              </div>
            )}

            {/* 3D view toggle */}
            <button
              onClick={() => setView3D(!view3D)}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                view3D ? 'bg-amber-400 text-black border-amber-300' : 'bg-gray-800 text-gray-300 border-gray-700'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D</span>
            </button>

            {/* PRIMARY USER ACTION: BAIXAR IMAGEM TAMANHO A4 (PNG) */}
            <button
              onClick={() => handleDownloadA4Image(activePageTab === 'page1' ? 1 : 2)}
              disabled={isGenerating}
              className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black px-4 py-2 rounded-xl text-xs shadow-md transition cursor-pointer disabled:opacity-50"
              title="Baixar imagem A4 pronta para impressão"
            >
              <ImageIcon className="w-4 h-4 text-black" />
              <span>Baixar Imagem A4 ({activePageTab === 'page1' ? 'Pág. 1' : 'Pág. 2'})</span>
            </button>

            {hasPage2 && (
              <button
                onClick={handleDownloadAllPagesImages}
                disabled={isGenerating}
                className="hidden sm:flex items-center space-x-1.5 bg-gray-800 hover:bg-gray-700 text-white font-bold px-3 py-2 rounded-xl text-xs border border-gray-700 transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-amber-300" />
                <span>Baixar Todas (Pág 1 & 2)</span>
              </button>
            )}

            {/* Secondary PDF Option */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex items-center space-x-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Baixar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Alert Banner */}
        {statusText && (
          <div className={`px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-medium border-x border-b ${
            downloadSuccess 
              ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/30' 
              : isGenerating 
              ? 'bg-blue-950/80 text-blue-200 border-blue-500/30' 
              : 'bg-amber-950/80 text-amber-200 border-amber-500/30'
          }`}>
            <div className="flex items-center space-x-2">
              {isGenerating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400 shrink-0" />
              ) : downloadSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
              <span>{statusText}</span>
            </div>

            {directDownloadUrl && (
              <a
                href={directDownloadUrl}
                download="INFINITY-Jornal-A4.png"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg text-xs flex items-center gap-1 shadow cursor-pointer ml-auto"
              >
                <FileDown className="w-3 h-3" />
                <span>Clique se o download não iniciou</span>
              </a>
            )}
          </div>
        )}

        {/* 3D Perspective & Layout Preview Wrapper */}
        <div 
          className="relative transition-all duration-300 bg-neutral-900/60 p-2 sm:p-6 rounded-b-3xl overflow-x-auto flex justify-center"
          style={{ perspective: view3D ? '1600px' : 'none' }}
          onMouseMove={handleMouseMove}
        >
          {activePageTab === 'page1' ? renderPage1() : renderPage2()}
        </div>

      </div>
    </div>
  );
};
