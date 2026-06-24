import { deflateRawSync, inflateRawSync } from "node:zlib";

export type XlsxCell = string | number | boolean | null | undefined;

type ZipEntry = {
  name: string;
  data: Buffer;
};

const textEncoder = new TextEncoder();

export function createSimpleXlsx(headers: string[], rows: XlsxCell[][], sheetName = "Products") {
  const sheet = worksheetXml(headers, rows);
  const files: ZipEntry[] = [
    {
      name: "[Content_Types].xml",
      data: bufferFromString(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`)
    },
    {
      name: "_rels/.rels",
      data: bufferFromString(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`)
    },
    {
      name: "xl/workbook.xml",
      data: bufferFromString(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`)
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: bufferFromString(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`)
    },
    {
      name: "xl/styles.xml",
      data: bufferFromString(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" applyFont="1"/></cellXfs>
</styleSheet>`)
    },
    { name: "xl/worksheets/sheet1.xml", data: bufferFromString(sheet) }
  ];

  return buildZip(files);
}

export function parseFirstSheet(buffer: Buffer) {
  const entries = readZip(buffer);
  const sheetEntry = entries.get("xl/worksheets/sheet1.xml");
  if (!sheetEntry) throw new Error("Excel dosyasında ilk çalışma sayfası bulunamadı.");

  const sharedStrings = parseSharedStrings(entries.get("xl/sharedStrings.xml")?.toString("utf8") ?? "");
  const sheetXml = sheetEntry.toString("utf8");
  const rows: string[][] = [];
  const rowMatches = sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g);

  for (const rowMatch of rowMatches) {
    const cells: string[] = [];
    const cellMatches = rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g);
    for (const cellMatch of cellMatches) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const ref = attr(attrs, "r");
      const index = ref ? columnIndex(ref.replace(/\d+/g, "")) : cells.length;
      cells[index] = readCellValue(attrs, body, sharedStrings);
    }
    rows.push(cells.map((cell) => cell ?? ""));
  }

  return rows;
}

function worksheetXml(headers: string[], rows: XlsxCell[][]) {
  const allRows = [headers, ...rows];
  const columnCount = headers.length;
  const widths = headers.map((header, index) => {
    const maxLength = Math.max(
      header.length,
      ...rows.map((row) => String(row[index] ?? "").length)
    );
    return Math.min(Math.max(maxLength + 2, 12), 42);
  });

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join("")}</cols>
  <sheetData>
    ${allRows.map((row, rowIndex) => rowXml(row, rowIndex + 1, columnCount)).join("")}
  </sheetData>
  <autoFilter ref="A1:${columnName(columnCount - 1)}${allRows.length}"/>
</worksheet>`;
}

function rowXml(row: XlsxCell[], rowNumber: number, columnCount: number) {
  const cells = Array.from({ length: columnCount }, (_, index) => cellXml(row[index], rowNumber, index));
  return `<row r="${rowNumber}">${cells.join("")}</row>`;
}

function cellXml(value: XlsxCell, rowNumber: number, columnIndexValue: number) {
  const ref = `${columnName(columnIndexValue)}${rowNumber}`;
  const style = rowNumber === 1 ? ` s="1"` : "";
  if (typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}"${style}><v>${value}</v></c>`;
  if (typeof value === "boolean") return `<c r="${ref}" t="b"${style}><v>${value ? 1 : 0}</v></c>`;
  return `<c r="${ref}" t="inlineStr"${style}><is><t>${xmlEscape(String(value ?? ""))}</t></is></c>`;
}

function buildZip(files: ZipEntry[]) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const name = bufferFromString(file.name);
    const compressed = deflateRawSync(file.data);
    const crc = crc32(file.data);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(file.data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, name, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(file.data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);
    offset += localHeader.length + name.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, end]);
}

function readZip(buffer: Buffer) {
  const entries = new Map<string, Buffer>();
  const endOffset = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (endOffset < 0) throw new Error("Geçerli bir XLSX/ZIP dosyası değil.");

  const entryCount = buffer.readUInt16LE(endOffset + 10);
  const centralOffset = buffer.readUInt32LE(endOffset + 16);
  let cursor = centralOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) throw new Error("Excel ZIP merkezi dizini okunamadı.");
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const fileNameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.subarray(cursor + 46, cursor + 46 + fileNameLength).toString("utf8");

    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressedData = buffer.subarray(dataStart, dataStart + compressedSize);
    const data = method === 0 ? compressedData : method === 8 ? inflateRawSync(compressedData) : null;
    if (data) entries.set(name, data);

    cursor += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function parseSharedStrings(xml: string) {
  if (!xml) return [];
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) => {
    const texts = [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((textMatch) => xmlUnescape(textMatch[1]));
    return texts.join("");
  });
}

function readCellValue(attrs: string, body: string, sharedStrings: string[]) {
  const type = attr(attrs, "t");
  if (type === "inlineStr") {
    const text = body.match(/<t\b[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? "";
    return xmlUnescape(text);
  }
  const raw = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
  if (type === "s") return sharedStrings[Number(raw)] ?? "";
  if (type === "b") return raw === "1" ? "TRUE" : "FALSE";
  return xmlUnescape(raw);
}

function attr(attrs: string, name: string) {
  return attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? "";
}

function columnIndex(column: string) {
  let index = 0;
  for (const char of column) index = index * 26 + char.charCodeAt(0) - 64;
  return Math.max(index - 1, 0);
}

function columnName(index: number) {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function xmlUnescape(value: string) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function bufferFromString(value: string) {
  return Buffer.from(textEncoder.encode(value));
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
