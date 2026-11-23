// Gera os ícones do site (favicon, PWA e Apple) a partir do símbolo vetorial.
// Uso: node scripts/gerar-icones.mjs (a partir de apps/web)
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const raiz = new URL('../', import.meta.url);
const caminho = (p) => new URL(p, raiz);

const simbolo = await readFile(caminho('public/brand/gig-mark.svg'), 'utf8');
const interno = simbolo.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

// Símbolo centralizado num quadrado; "escala" é a fração da altura ocupada.
function svgQuadrado({ fundo, raio = 0, escala, traco = 26 }) {
  const lado = 512;
  const altura = lado * escala;
  const largura = (altura * 300) / 412;
  const corpo = interno.replace(/stroke-width="26"/, `stroke-width="${traco}"`);
  const fundoSvg = fundo
    ? `<rect width="${lado}" height="${lado}" rx="${raio}" fill="${fundo}"/>`
    : '';
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}">` +
      fundoSvg +
      `<svg x="${(lado - largura) / 2}" y="${(lado - altura) / 2}" width="${largura}" height="${altura}" viewBox="112 48 300 412">${corpo}</svg>` +
      `</svg>`,
  );
}

const png = (svg, tamanho) =>
  sharp(svg, { density: 300 }).resize(tamanho, tamanho).png().toBuffer();

// Ícone de aba: quadrado arredondado branco e traço mais grosso para ler em 16 px.
const aba = svgQuadrado({ fundo: '#FFFFFF', raio: 112, escala: 0.8, traco: 38 });
const app = svgQuadrado({ fundo: '#FFFFFF', escala: 0.72 });
const mascaravel = svgQuadrado({ fundo: '#FFFFFF', escala: 0.56 });

const saidas = [
  ['public/icon.png', aba, 64],
  ['public/apple-icon.png', app, 180],
  ['public/icons/icon-192.png', app, 192],
  ['public/icons/icon-512.png', app, 512],
  ['public/icons/icon-maskable-512.png', mascaravel, 512],
];
for (const [destino, svg, tamanho] of saidas) {
  await writeFile(caminho(destino), await png(svg, tamanho));
}

// favicon.ico com PNGs de 16, 32 e 48 px embutidos.
const tamanhos = [16, 32, 48];
const imagens = await Promise.all(tamanhos.map((t) => png(aba, t)));
const cabecalho = Buffer.alloc(6 + 16 * imagens.length);
cabecalho.writeUInt16LE(0, 0);
cabecalho.writeUInt16LE(1, 2);
cabecalho.writeUInt16LE(imagens.length, 4);
let deslocamento = cabecalho.length;
imagens.forEach((img, i) => {
  const base = 6 + 16 * i;
  cabecalho.writeUInt8(tamanhos[i], base);
  cabecalho.writeUInt8(tamanhos[i], base + 1);
  cabecalho.writeUInt16LE(1, base + 4);
  cabecalho.writeUInt16LE(32, base + 6);
  cabecalho.writeUInt32LE(img.length, base + 8);
  cabecalho.writeUInt32LE(deslocamento, base + 12);
  deslocamento += img.length;
});
const ico = Buffer.concat([cabecalho, ...imagens]);
await writeFile(caminho('public/favicon.ico'), ico);

console.log('Ícones gerados.');
