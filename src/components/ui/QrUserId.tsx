"use client";

import { QRCodeSVG } from "qrcode.react";
import { useCallback, useRef } from "react";

interface QrUserIdProps {
  userId: number;
  name: string;
  className?: string;
}

export function QrUserId({ userId, name, className }: QrUserIdProps) {
  const qrValue = `ATTENDANCE:USER:${userId}:${name}`;
  const svgRef = useRef<SVGSVGElement>(null);

  const download = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `QR-${name.replace(/\s+/g, "_")}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  }, [name]);

  return (
    <QRCodeSVG
      ref={svgRef}
      value={qrValue}
      size={160}
      level="M"
      bgColor="#ffffff"
      fgColor="#0f172a"
      className={className}
      onClick={download}
      style={{ cursor: "pointer" }}
    />
  );
}
