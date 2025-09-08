"use client";

import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';

interface PdfGeneratorButtonProps {
  children: React.ReactNode;
  fileName: string;
  rootElementId: string; // ID do elemento HTML que contém o conteúdo a ser convertido
  buttonText?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function PdfGeneratorButton({
  children,
  fileName,
  rootElementId,
  buttonText = "Baixar PDF",
  variant = "outline",
  size = "sm",
  className,
}: PdfGeneratorButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGeneratePdf = async () => {
    setLoading(true);
    try {
      const input = document.getElementById(rootElementId);
      if (!input) {
        throw new Error(`Element with ID "${rootElementId}" not found.`);
      }

      // Temporarily hide scrollbars to prevent them from appearing in the PDF
      const originalOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';

      const canvas = await html2canvas(input, {
        scale: 2, // Increase scale for better resolution
        useCORS: true, // Enable CORS for images
        windowWidth: input.scrollWidth,
        windowHeight: input.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height], // Use canvas dimensions for PDF
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${fileName}.pdf`);

      toast({
        title: "PDF gerado!",
        description: "O arquivo PDF foi baixado com sucesso.",
      });
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: error.message || "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      // Restore scrollbars
      document.documentElement.style.overflow = originalOverflow;
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGeneratePdf}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {buttonText}
    </Button>
  );
}