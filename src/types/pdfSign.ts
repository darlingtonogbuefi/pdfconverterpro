// src\types\pdfSign.ts

export interface SignaturePayload {
  x: number
  y: number
  width: number
  height: number
  page: number
  imageBase64: string
  date: string
}

export interface PdfSignRequest {
  file: File
  signature: SignaturePayload
}

export interface PdfSignResponse {
  downloadUrl: string
}
