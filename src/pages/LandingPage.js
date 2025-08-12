import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import LottieInvoice from "../components/LotiIcon/LottieInvoice";
import LottiePersons from "../components/LotiIcon/LottiePersons";
import LottieProduct from "../components/LotiIcon/LottieProduct";
import LottieMoney from "../components/LotiIcon/LottieMoney";
import LoginScreen from "./LoginScreen";

export default function LandingPage({ onAuth, onToken, onCloudSyncReady }) {
  const [showLogin, setShowLogin] = useState(false)
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-30 w-full backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/80 border-b border-gray-99">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logislip.png" alt="Logislip" className="h-8 md:h-9 lg:h-10 w-auto object-contain" />
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
            <a href="#templates" className="text-gray-600 hover:text-gray-900">Templates</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="#faq" className="text-gray-600 hover:text-gray-900">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLogin(true)}
              className="hidden sm:inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign in
            </button>
            <button
              onClick={() => setShowLogin(true)}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Start free
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black via-gray-900 to-black" />
          <div className="pointer-events-none absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute top-72 -right-24 h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="mx-auto max-w-7xl px-6 pt-24 pb-28">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <h1 className="mt-2 text-5xl sm:text-6xl font-semibold tracking-tight text-blue-600/90">
                  Invoice. Reimagined.
                </h1>
                <p className="mt-3 text-sm sm:text-base tracking-widest uppercase text-blue-500/90">
                  The next era of Invoicing
                </p>
                <p className="mt-5 text-lg text-gray-500 max-w-xl">
                  Take invoicing to the next level. Experience unmatched speed, security, and reliability with Edge Computing.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowLogin(true)}
                    aria-label="Start free with Logislip"
                    className="inline-flex items-center justify-center rounded-full bg-[#0066FF] px-7 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-[#0a5ae6] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black transition"
                  >
                    Start free
                  </button>
                </div>

              </motion.div>

              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="relative">
                <div>
                  <div className="w-full h-[420px] flex items-center justify-center">
                    <LottieInvoice className="w-[320px] h-[320px]" loop />
                  </div>
                </div>

                {/* Simple, subtle float animations for mini Lotties */}
                <div className="pointer-events-none absolute inset-0 hidden md:flex items-center justify-center">
                  <div className="relative" style={{ width: 420, height: 420 }}>
                    {/* Clients */}
                    <motion.div
                      className="absolute -top-10 right-8"
                      animate={{ y: [-6, 6, -6], x: [2, -2, 2] }}
                      transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                    >
                      <LottiePersons className="w-[100px] h-[100px] opacity-80" loop />
                    </motion.div>
                    {/* Products */}
                    <motion.div
                      className="absolute top-1/3 -left-16 -translate-y-1/2"
                      animate={{ y: [6, -6, 6], x: [-2, 2, -2] }}
                      transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
                    >
                      <LottieProduct className="w-[100px] h-[100px] opacity-80" loop />
                    </motion.div>
                    {/* Money/Balance */}
                    <motion.div
                      className="absolute -bottom-10 left-8"
                      animate={{ y: [-4, 4, -4], x: [1, -1, 1] }}
                      transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                    >
                      <LottieMoney className="w-[110px] h-[110px] opacity-80" loop />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <h2 className="text-center text-3xl sm:text-4xl font-semibold tracking-tight">
              Power for every part of invoicing
            </h2>
            <p className="mt-3 text-center text-gray-600 max-w-2xl mx-auto">
              Create invoices, sync to Google Drive, share via Gmail or WhatsApp, and keep backups—fast and secure.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "Templates", desc: "Default, Modern, and Formal layouts built-in.", meta: "Pro+ get all templates" },
                { title: "Drive export", desc: "Save PDFs directly to Google Drive.", meta: "Pro+" },
                { title: "Gmail share", desc: "Send invoices with PDF via Gmail.", meta: "Pro+" },
                { title: "WhatsApp share", desc: "Share invoice details in one tap.", meta: "All plans" },
                { title: "Cloud sync", desc: "Auto-sync every 30–5 minutes based on plan.", meta: "Pro/Business" },
                { title: "Backups", desc: "Export and import full backups anytime.", meta: "All plans" },
              ].map((f) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-2xl border border-gray-200 p-8 bg-white hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
                  <p className="mt-4 text-xs text-gray-500">{f.meta}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="templates" className="bg-gray-100 text-black">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Templates</h2>
                <p className="mt-4 text-black-300 max-w-xl">
                  Choose from Default, Modern, and Formal templates. Pro+ plans unlock all templates and Drive export.
                </p>
                <div className="mt-8 grid grid-cols-3 gap-3 text-center text-sm">
                  {['Default', 'Modern', 'Formal'].map((name) => (
                    <div key={name} className="rounded-xl bg-white/5 border border-gray-500/80 px-3 py-2">
                      {name}
                    </div>
                  ))}
                </div>
              </div>
              {/* Focus carousel with fallback images and push-to-focus animation */}
              <TemplatesCarousel />
            </div>
          </div>
        </section>

        <section id="pricing" className="relative border-y border-gray-100 bg-gradient-to-b from-gray-50 to-white">
          <div className="mx-auto max-w-7xl px-6 py-20">
            <div className="grid gap-8 lg:grid-cols-3 lg:items-end">
              <div className="lg:col-span-2">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Simple pricing</h2>
                <p className="mt-3 text-gray-600 max-w-xl">
                  Start for free. Pro adds Drive export and 30‑minute auto-sync. Business unlocks everything with 5‑minute auto-sync and custom templates.
                </p>
              </div>
              <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="rounded-2xl border border-gray-200 p-6 bg-white shadow-sm">
                <div className="flex items-end gap-2">
                  <div className="text-3xl font-bold text-gray-900">Free</div>
                  <div className="text-gray-500">/ forever</div>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-gray-700">
                  <li>3 invoices save & export</li>
                  <li>1 client, 1 product</li>
                  <li>Default template</li>
                  <li>Manual sync</li>
                </ul>
                <Link
                  to="/signin"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Get started
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="grid gap-6 md:grid-cols-3">
              {[{h:"Works with", p:"Google Drive for export, Gmail for email send, WhatsApp for quick share."}, {h:"UPI/Razorpay", p:"Pay securely and upgrade plans with Razorpay (India)."}, {h:"Privacy", p:"Sync and backups designed with transparency. You control your data."}].map((c) => (
                <div key={c.h} className="rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-base font-semibold text-gray-900">{c.h}</h3>
                  <p className="mt-2 text-sm text-gray-600">{c.p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="bg-white">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="text-center text-2xl sm:text-3xl font-semibold tracking-tight">FAQ</h2>
            <div className="mt-8 divide-y divide-gray-200 border border-gray-200 rounded-2xl overflow-hidden">
              {[
                {
                  q: "How do backups and Google Drive sync work?",
                  a:
                    "You can export/import full backups anytime. With Pro and Business plans, invoices can auto‑sync to your Google Drive (every 30–5 minutes depending on plan). We use your own Google account—tokens are stored locally and can be revoked at any time.",
                },
                {
                  q: "Can I share invoices directly?",
                  a:
                    "Yes. Send invoices with a PDF attachment via Gmail, share a Drive link after export, or send details over WhatsApp in one tap. Email attachments require viewing an invoice to generate a PDF.",
                },
                {
                  q: "Is there a free trial? What happens after?",
                  a:
                    "Start on the Free plan—no credit card required. Upgrade anytime to Pro for Drive export and Gmail send, or to Business for faster auto‑sync and advanced options. You can cancel anytime; your data remains available for export.",
                },
              ].map((item) => (
                <details key={item.q} className="group p-6 open:bg-gray-50">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-gray-900">
                    {item.q}
                    <span className="ml-4 text-gray-500 group-open:rotate-180 transition">⌄</span>
                  </summary>
                  <p className="mt-3 text-sm text-gray-600">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Login modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogin(false)} />
          <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md">
              <EmbeddedLogin onClose={() => setShowLogin(false)} onAuth={onAuth} onToken={onToken} onCloudSyncReady={onCloudSyncReady} />
            </div>
          </div>
        </div>
      )}

      <footer className="bg-white border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} LogiSlip. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/privacy-policy" className="text-gray-600 hover:text-gray-900">Privacy</Link>
            <Link to="/terms-of-service" className="text-gray-600 hover:text-gray-900">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}



// Local component: modern focus carousel using Framer Motion
function TemplatesCarousel() {
  // Filenames expected to exist; we'll resolve at runtime and inline as data URLs for reliability
  const targetFiles = ['1-land-inv.jpg', '2-land-inv.jpg', '3-land-inv.jpg']
  const [images, setImages] = useState([])
  const [index, setIndex] = useState(0)

  // Resolve URLs from common public paths and inline as base64 once loaded
  useEffect(() => {
    const basePaths = [
      `${process.env.PUBLIC_URL || ''}/`,
      `${process.env.PUBLIC_URL || ''}/images/`,
      '/',
      '/images/',
    ]

    const probeImage = (url) =>
      new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(url)
        img.onerror = () => resolve(null)
        img.src = url
      })

    const toDataUrl = async (url) => {
      try {
        const res = await fetch(url)
        if (!res.ok) return url
        const blob = await res.blob()
        return await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      } catch {
        return url
      }
    }

    const resolveAll = async () => {
      const resolved = []
      for (const file of targetFiles) {
        let found = null
        for (const base of basePaths) {
          // Avoid duplicate slashes
          const candidate = `${base}${file}`.replace(/\/+/, '/').replace(':/', '://')
          // eslint-disable-next-line no-await-in-loop
          const ok = await probeImage(candidate)
          if (ok) {
            found = ok
            break
          }
        }
        // Inline as data URL when possible
        // eslint-disable-next-line no-await-in-loop
        const finalUrl = found ? await toDataUrl(found) : null
        if (finalUrl) resolved.push(finalUrl)
      }
      if (resolved.length > 0) setImages(resolved)
    }

    resolveAll()
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % images.length)
    }, 3500)
    return () => clearInterval(t)
  }, [images.length])

  // Compute neighbors for a 3-card focus layout
  const leftIdx = images.length ? (index - 1 + images.length) % images.length : 0
  const rightIdx = images.length ? (index + 1) % images.length : 0

  const cards = [leftIdx, index, rightIdx]

  return (
    <div className="relative h-60 sm:h-72 md:h-80 overflow-visible">
      <div className="absolute inset-0 flex items-center justify-center">
        {images.length > 0 && cards.map((idx, pos) => {
          const isCenter = pos === 1
          const baseX = pos === 0 ? -150 : pos === 2 ? 150 : 0
          const baseScale = isCenter ? 1 : 0.85
          const baseOpacity = isCenter ? 1 : 0.6
          const z = isCenter ? 20 : 10

          return (
            <motion.div
              key={`card-${idx}`}
              className="absolute rounded-xl overflow-hidden bg-white/5 border border-white/10"
              initial={{ x: baseX, scale: baseScale, opacity: baseOpacity }}
              animate={{ x: baseX, scale: baseScale, opacity: baseOpacity }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              style={{ width: 180, height: 240, zIndex: z }}
            >
              <img src={images[idx]} alt="Invoice preview" className="w-full h-full object-cover" />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function EmbeddedLogin({ onClose, onAuth, onToken, onCloudSyncReady }) {
  return (
    <div>
      <div className="flex justify-end">
        <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700" aria-label="Close login">
          ✕
        </button>
      </div>
      <LoginScreen embedded onAuth={onAuth} onToken={onToken} onCloudSyncReady={onCloudSyncReady} />
    </div>
  )
}
