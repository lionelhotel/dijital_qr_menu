import QRCode from "qrcode";

export async function createQrPngDataUrl(targetUrl: string) {
  return QRCode.toDataURL(targetUrl, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 1200,
    color: {
      dark: "#2B2926",
      light: "#FFFFFF"
    }
  });
}

export async function createQrSvg(targetUrl: string) {
  return QRCode.toString(targetUrl, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 2,
    width: 1200,
    color: {
      dark: "#2B2926",
      light: "#FFFFFF"
    }
  });
}
