import WeddingClient from "@/app/convite/casamento/client"
import { headers } from "next/headers"

export default async function Page({ params }) {
  const { token } = params
  const h = headers()
  const proto = h.get("x-forwarded-proto") || "http"
  const host  = h.get("x-forwarded-host") || h.get("host")
  const base  = `${proto}://${host}`

  const res = await fetch(`${base}/api/public/rsvp/${token}`, { cache: "no-store" })

  if (!res.ok) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center">
        <h1 className="text-xl font-semibold">Evento não encontrado</h1>
        <p className="text-muted-foreground mt-2">Verifique o link do convite.</p>
      </div>
    )
  }

  const event = await res.json()
  return <WeddingClient event={event} />
}
