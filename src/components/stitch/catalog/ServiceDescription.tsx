"use client";
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/utils/ui";

/**
 * Parses basic markdown (**bold**, *italic*, \n) into React nodes.
 */
function parseSimpleMarkdown(text: string) {
    if (!text) return null;
    
    // Split by lines first to handle <br/>
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
        // Split by **bold**
        const boldParts = line.split(/(\*\*.*?\*\*)/g);
        
        const lineNodes = boldParts.map((boldPart, bIndex) => {
            if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
                return <strong key={bIndex} className="font-bold text-current">{boldPart.slice(2, -2)}</strong>;
            }
            
            // Split by *italic*
            const italicParts = boldPart.split(/(\*.*?\*)/g);
            return italicParts.map((italicPart, iIndex) => {
                if (italicPart.startsWith('*') && italicPart.endsWith('*')) {
                    return <em key={iIndex} className="italic text-current opacity-90">{italicPart.slice(1, -1)}</em>;
                }
                return <React.Fragment key={iIndex}>{italicPart}</React.Fragment>;
            });
        });
        
        return (
            <React.Fragment key={lineIndex}>
                {lineNodes}
                {lineIndex < lines.length - 1 && <br />}
            </React.Fragment>
        );
    });
}

interface ServiceDescriptionProps {
    text: string;
    className?: string;
    expandable?: boolean;
    maxLines?: number;
}

export function ServiceDescription({ text, className, expandable = true, maxLines = 3 }: ServiceDescriptionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [needsExpansion, setNeedsExpansion] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!textRef.current || !expandable) return;
        
        // Simple check: if the content exceeds the line height * maxLines, it needs expanding
        // Tailwind text-xs leading-relaxed is about 18-20px per line
        const lineHeight = 20; 
        const maxHeight = lineHeight * maxLines;
        
        if (textRef.current.scrollHeight > maxHeight + 5) {
            setNeedsExpansion(true);
        }
    }, [text, expandable, maxLines]);

    const renderedNodes = parseSimpleMarkdown(text || "");

    return (
        <div className="relative">
            <div 
                ref={textRef}
                className={cn(
                    className,
                    "transition-all duration-300",
                    !isExpanded && expandable ? `line-clamp-${maxLines}` : ""
                )}
            >
                {renderedNodes}
            </div>
            
            {needsExpansion && expandable && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="mt-1.5 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors"
                >
                    {isExpanded ? (
                        <>Свернуть <ChevronUp size={12} /></>
                    ) : (
                        <>Читать далее <ChevronDown size={12} /></>
                    )}
                </button>
            )}
        </div>
    );
}
