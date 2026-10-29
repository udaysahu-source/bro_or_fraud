export interface ShareCardData {
  title: string;
  subtitle: string;
  fraudName: string;
  fraudEmoji: string;
  word: string;
  roast: string;
  scores: { name: string; points: number; emoji: string }[];
}

// Renders a 1080x1350 (Instagram portrait) branded PNG on a canvas.
export async function renderShareCard(data: ShareCardData): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background void
  ctx.fillStyle = "#090A0F";
  ctx.fillRect(0, 0, W, H);

  // Magenta glow
  const g1 = ctx.createRadialGradient(W * 0.85, H * 0.15, 20, W * 0.85, H * 0.15, 700);
  g1.addColorStop(0, "rgba(255,0,85,0.55)");
  g1.addColorStop(1, "rgba(255,0,85,0)");
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  // Lime glow
  const g2 = ctx.createRadialGradient(W * 0.1, H * 0.9, 20, W * 0.1, H * 0.9, 800);
  g2.addColorStop(0, "rgba(204,255,0,0.45)");
  g2.addColorStop(1, "rgba(204,255,0,0)");
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  // Grid dots
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  for (let x = 0; x < W; x += 40) {
    for (let y = 0; y < H; y += 40) {
      ctx.fillRect(x, y, 2, 2);
    }
  }

  // Border
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  // Brand chip
  ctx.fillStyle = "#CCFF00";
  ctx.fillRect(80, 90, 90, 90);
  ctx.fillStyle = "#090A0F";
  ctx.font = "900 60px 'Space Grotesk', system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText("B?", 125, 138);

  ctx.fillStyle = "#94A3B8";
  ctx.font = "700 22px 'Space Grotesk', system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("BRO OR FRAUD? · MATCH RECAP", 195, 145);

  // Kicker
  ctx.fillStyle = "#FF0055";
  ctx.font = "900 26px 'Space Grotesk', system-ui, sans-serif";
  ctx.fillText("// " + data.subtitle.toUpperCase(), 80, 260);

  // Title (big, wrap)
  ctx.fillStyle = "#F8FAFC";
  ctx.font = "900 130px 'Space Grotesk', system-ui, sans-serif";
  const lines = wrap(ctx, data.title.toUpperCase(), W - 160);
  let y = 380;
  for (const line of lines) {
    ctx.fillText(line, 80, y);
    y += 130;
  }

  // Card: fraud reveal
  const cardY = y + 40;
  const cardH = 220;
  ctx.fillStyle = "rgba(255,0,85,0.1)";
  ctx.strokeStyle = "rgba(255,0,85,0.6)";
  ctx.lineWidth = 3;
  roundRect(ctx, 80, cardY, W - 160, cardH, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255,0,85,0.25)";
  roundRect(ctx, 110, cardY + 40, 140, 140, 20);
  ctx.fill();
  ctx.fillStyle = "#F8FAFC";
  ctx.font = "80px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(data.fraudEmoji, 180, cardY + 130);

  ctx.textAlign = "left";
  ctx.fillStyle = "#FF0055";
  ctx.font = "900 20px 'Space Grotesk', system-ui, sans-serif";
  ctx.fillText("THE FRAUD WAS", 280, cardY + 70);
  ctx.fillStyle = "#F8FAFC";
  ctx.font = "900 68px 'Space Grotesk', system-ui, sans-serif";
  ctx.fillText(data.fraudName.toUpperCase(), 280, cardY + 135);
  ctx.fillStyle = "#94A3B8";
  ctx.font = "600 24px 'Inter', system-ui, sans-serif";
  ctx.fillText(`Secret word: ${data.word}`, 280, cardY + 175);

  // Roast bar
  const roastY = cardY + cardH + 30;
  ctx.fillStyle = "rgba(204,255,0,0.12)";
  ctx.strokeStyle = "rgba(204,255,0,0.5)";
  roundRect(ctx, 80, roastY, W - 160, 110, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#CCFF00";
  ctx.font = "900 20px 'Space Grotesk', system-ui, sans-serif";
  ctx.fillText("ROAST OF THE MATCH", 110, roastY + 40);
  ctx.fillStyle = "#F8FAFC";
  ctx.font = "700 26px 'Inter', system-ui, sans-serif";
  const roastLines = wrap(ctx, `"${data.roast}"`, W - 220);
  ctx.fillText(roastLines[0] ?? "", 110, roastY + 78);

  // Scores
  const sY = roastY + 150;
  ctx.fillStyle = "#94A3B8";
  ctx.font = "900 22px 'Space Grotesk', system-ui, sans-serif";
  ctx.fillText("FINAL SCORE", 80, sY);

  data.scores.slice(0, 4).forEach((row, i) => {
    const rowY = sY + 30 + i * 62;
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 2;
    roundRect(ctx, 80, rowY, W - 160, 52, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#94A3B8";
    ctx.font = "900 22px 'Space Grotesk', system-ui, sans-serif";
    ctx.fillText(`${i + 1}`, 100, rowY + 34);
    ctx.font = "28px system-ui";
    ctx.fillText(row.emoji, 130, rowY + 38);
    ctx.fillStyle = "#F8FAFC";
    ctx.font = "800 26px 'Inter', system-ui, sans-serif";
    ctx.fillText(row.name, 180, rowY + 34);

    ctx.textAlign = "right";
    ctx.fillStyle = "#CCFF00";
    ctx.font = "900 28px 'Space Grotesk', system-ui, sans-serif";
    ctx.fillText(`+${row.points}`, W - 100, rowY + 34);
    ctx.textAlign = "left";
  });

  // Footer
  ctx.fillStyle = "#94A3B8";
  ctx.font = "700 20px 'Space Grotesk', system-ui, sans-serif";
  ctx.fillText("PLAY AT BROORFRAUD.APP", 80, H - 90);
  ctx.textAlign = "right";
  ctx.fillStyle = "#CCFF00";
  ctx.fillText("#BROORFRAUD", W - 80, H - 90);

  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b as Blob), "image/png"),
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export async function shareCard(
  blob: Blob,
  text: string,
  target?: "whatsapp" | "instagram" | "native",
): Promise<"shared" | "downloaded"> {
  const file = new File([blob], "bro-or-fraud.png", { type: "image/png" });
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  if (target !== "whatsapp" && nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], text, title: "Bro or Fraud?" });
      return "shared";
    } catch {
      /* fall through to download */
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bro-or-fraud.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  if (target === "whatsapp") {
    window.open(`https://wa.me/?text=${encodeURIComponent(text + " broorfraud.app")}`, "_blank");
  }
  return "downloaded";
}
