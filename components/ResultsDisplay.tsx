
import React, { useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ConceptNetworkMap } from './ConceptNetworkMap';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

interface ResultsDisplayProps {
  result: string;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const { markdown, conceptData } = useMemo(() => {
    try {
      // Find JSON block in the markdown
      const jsonRegex = /```json\n([\s\S]*?)\n```/;
      const match = result.match(jsonRegex);

      if (match && match[1]) {
        const jsonStr = match[1];
        const data = JSON.parse(jsonStr);
        
        // Remove the data section from markdown to display it separately
        const cleanedMarkdown = result.replace(/## Concept Map Data[\s\S]*$/, '').trim();
        
        return {
          markdown: cleanedMarkdown,
          conceptData: data
        };
      }
    } catch (e) {
      console.error("Failed to parse concept map data:", e);
    }

    return { markdown: result, conceptData: null };
  }, [result]);

  const handleExportPDF = () => {
    if (!reportRef.current) return;

    const element = reportRef.current;
    const htmlElement = document.documentElement;
    const wasDark = htmlElement.classList.contains('dark');
    
    // Temporarily disable dark mode
    if (wasDark) htmlElement.classList.remove('dark');
    element.classList.add('export-print-mode');

    const opt = {
      margin: [15, 12, 15, 12],
      filename: 'document_analysis_report.pdf',
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 3, 
        useCORS: true, 
        logging: false,
        backgroundColor: '#ffffff',
        letterRendering: true,
        allowTaint: true,
        windowWidth: 1200
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Use a small delay to ensure styles are applied
    setTimeout(() => {
      html2pdf().set(opt).from(element).save().then(() => {
        element.classList.remove('export-print-mode');
        // Restore dark mode
        if (wasDark) htmlElement.classList.add('dark');
      });
    }, 100);
  };

  const handleExportWord = () => {
    if (!markdown) return;

    const lines = markdown.split('\n');
    const docChildren: Paragraph[] = [];

    // Title Block
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Document Methodology Analysis Report",
            bold: true,
            size: 36, // 18pt
            color: "1e40af",
          }),
        ],
        spacing: { after: 120 },
      })
    );

    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated on: ${new Date().toLocaleDateString()}`,
            color: "64748b",
            size: 20, // 10pt
            italic: true,
          }),
        ],
        spacing: { after: 480 },
      })
    );

    // Separator line
    docChildren.push(
      new Paragraph({
        border: {
          bottom: {
            color: "cbd5e1",
            space: 1,
            style: "single",
            size: 12,
          },
        },
        spacing: { after: 240 },
      })
    );

    const parseTextToRuns = (text: string): TextRun[] => {
      const runs: TextRun[] = [];
      const parts = text.split(/(\*\*.*?\*\*)/g);
      
      for (const part of parts) {
        if (part.startsWith('**') && part.endsWith('**')) {
          const content = part.slice(2, -2);
          runs.push(new TextRun({ text: content, bold: true, color: "0f172a" }));
        } else if (part) {
          runs.push(new TextRun({ text: part, color: "334155" }));
        }
      }
      return runs;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        continue;
      }

      if (line.startsWith('# ')) {
        docChildren.push(
          new Paragraph({
            children: parseTextToRuns(line.substring(2)),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          })
        );
      } else if (line.startsWith('## ')) {
        docChildren.push(
          new Paragraph({
            children: parseTextToRuns(line.substring(3)),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          })
        );
      } else if (line.startsWith('### ')) {
        docChildren.push(
          new Paragraph({
            children: parseTextToRuns(line.substring(4)),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          })
        );
      } else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
        const content = line.substring(2).trim();
        docChildren.push(
          new Paragraph({
            children: parseTextToRuns(content),
            bullet: {
              level: 0,
            },
            spacing: { before: 100, after: 100 },
          })
        );
      } else if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^(\d+\.\s)(.*)/);
        if (match) {
          const prefix = match[1];
          const content = match[2].trim();
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({ text: prefix, bold: true, color: "1e40af" }),
                ...parseTextToRuns(content),
              ],
              spacing: { before: 100, after: 100 },
            })
          );
        }
      } else {
        docChildren.push(
          new Paragraph({
            children: parseTextToRuns(line),
            spacing: { before: 120, after: 120 },
          })
        );
      }
    }

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Segoe UI",
              size: 22, // 11pt
              color: "334155",
            },
          },
        },
      },
      sections: [
        {
          properties: {},
          children: docChildren,
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, 'document_analysis_report.docx');
    }).catch((err) => {
      console.error("Error generating docx:", err);
    });
  };

  const generateId = (text: string) => {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const handleNodeDoubleClick = (nodeId: string) => {
    // Try to find a header or list item that contains this nodeId
    const targetId = generateId(nodeId);
    
    // 1. Try exact ID match (for headers)
    let element = document.getElementById(targetId);

    // 2. If not found, try searching for text content in headers or strong tags
    if (!element) {
      const elements = reportRef.current?.querySelectorAll('h2, h3, strong, li');
      if (elements) {
        for (const el of Array.from(elements)) {
          if (el.textContent?.toLowerCase().includes(nodeId.toLowerCase())) {
            element = el as HTMLElement;
            break;
          }
        }
      }
    }

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a brief highlight effect
      element.classList.add('ring-4', 'ring-blue-400', 'ring-opacity-50', 'rounded', 'transition-all', 'duration-500');
      setTimeout(() => {
        element?.classList.remove('ring-4', 'ring-blue-400', 'ring-opacity-50');
      }, 2000);
    }
  };

  return (
    <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-end gap-3">
        <button
          onClick={handleExportWord}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Word (.docx)
        </button>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export PDF
        </button>
      </div>

      <div ref={reportRef} className="space-y-8 pdf-content">
        <div className="bg-white dark:bg-gray-800/50 p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.364 6.364l-.707-.707M6.342 6.342l-.707-.707m12.728 0l-.707.707M12 21a9 9 0 110-18 9 9 0 010 18zm0-9a3 3 0 110-6 3 3 0 010 6z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Analysis Insights</h3>
          </div>

          <div className="markdown-body prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-blue-600 dark:prose-a:text-blue-400">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({node, ...props}) => {
                  const content = props.children?.toString() || '';
                  const id = generateId(content);
                  return (
                    <h2 {...props} id={id} className="text-xl font-bold mt-8 mb-4 pb-2 border-b-2 border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-300 flex items-center gap-2 scroll-mt-24">
                      <span className="w-2 h-6 bg-blue-500 rounded-full inline-block"></span>
                      {props.children}
                    </h2>
                  );
                },
                h3: ({node, ...props}) => {
                  const content = props.children?.toString() || '';
                  const id = generateId(content);
                  return (
                    <h3 {...props} id={id} className="text-lg font-bold mt-6 mb-3 text-indigo-700 dark:text-indigo-400 flex items-center gap-2 scroll-mt-24">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      {props.children}
                    </h3>
                  );
                },
                ul: ({node, ...props}) => (
                  <ul {...props} className="space-y-3 my-4 list-none pl-0" />
                ),
                li: ({node, ...props}) => {
                  const content = props.children?.toString() || '';
                  const isReference = content.includes('[') || content.match(/^[A-Z][a-z]+ \d{4}/);
                  const id = generateId(content.substring(0, 30));
                  return (
                    <li id={id} className="flex items-start gap-3 group scroll-mt-24">
                      <span className={`mt-1.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                        isReference 
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-800/40' 
                          : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-800/40'
                      }`}>
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                          {isReference ? (
                            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                          ) : (
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          )}
                        </svg>
                      </span>
                      <span className={`${isReference ? 'text-indigo-600/80 dark:text-indigo-400/80 text-sm italic' : 'text-gray-700 dark:text-gray-300'} leading-relaxed`}>
                        {props.children}
                      </span>
                    </li>
                  );
                },
                strong: ({node, ...props}) => {
                  const content = props.children?.toString() || '';
                  const id = generateId(content);
                  return (
                    <strong {...props} id={id} className="font-bold text-gray-900 dark:text-white bg-blue-50/50 dark:bg-blue-900/10 px-1 rounded scroll-mt-24" />
                  );
                },
                p: ({node, ...props}) => (
                  <p {...props} className="leading-relaxed mb-4 text-gray-700 dark:text-gray-300" />
                )
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </div>

        {conceptData && (
          <div className="bg-white dark:bg-gray-800/50 p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Concept Network Map</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Double-click a node to scroll to its analysis</p>
              </div>
            </div>
            <ConceptNetworkMap data={conceptData} onNodeDoubleClick={handleNodeDoubleClick} />
          </div>
        )}
      </div>
    </div>
  );
};
