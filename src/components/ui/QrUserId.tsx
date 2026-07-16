"use client";

import { QRCodeSVG } from "qrcode.react";

interface QrUserIdProps {
  userId: number;
  name: string;
  className?: string;
}

export function QrUserId({ userId, name, className }: QrUserIdProps) {
  const qrValue = `ATTENDANCE:USER:${userId}:${name}`;

  return (
    <QRCodeSVG
      value={qrValue}
      size={160}
      level="M"
      bgColor="#ffffff"
      fgColor="#0f172a"
      className={className}
    />
  );
}
