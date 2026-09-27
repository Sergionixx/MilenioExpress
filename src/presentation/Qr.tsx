import { useEffect, useState } from "react"
import QRCode from "qrcode"

export default function ParticipantQr({ url }: { url: string }) {
  const [image, setImage] = useState("")
  useEffect(() => {
    let active = true
    void QRCode.toDataURL(url, { width: 180, margin: 1, errorCorrectionLevel: "M", color: { dark: "#172c46", light: "#ffffff" } })
      .then((value) => { if (active) setImage(value) }).catch(() => { if (active) setImage("") })
    return () => { active = false }
  }, [url])
  return image ? <img className="participant-qr" src={image} alt="Escanea para abrir el rastreo y crear paquetes en tu teléfono" width={80} height={80}/> : null
}
