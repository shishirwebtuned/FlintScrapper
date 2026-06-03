'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/Navbar'

// ── Animated counter hook ──
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true) },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [started, target, duration])

  return { count, ref }
}

// ── Floating lead card ──
function LeadCard({ delay = 0, title, trade, location, urgency, score, style = {} }: {
  delay?: number
  title: string
  trade: string
  location: string
  urgency: string
  score: number
  style?: React.CSSProperties
}) {
  const urgencyColor = urgency === 'Emergency' ? '#EF4444' : urgency === 'This week' ? '#F59E0B' : '#22C55E'

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -4, scale: 1.02 }}
      style={style}
      className="absolute w-72 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-[18px] shadow-lg backdrop-blur-[20px] cursor-default"
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-5 right-5 h-0.5 bg-gradient-to-r from-transparent via-[var(--ember-500)] to-transparent rounded-full" />

      <div className="flex justify-between items-center mb-2.5">
        <span className="text-xs font-semibold bg-[rgba(255,107,53,0.12)] text-[var(--ember-500)] px-2.5 py-0.75 rounded-full border border-[rgba(255,107,53,0.2)]">
          {trade}
        </span>
        <div className="bg-[var(--bg-surface-raised)] border border-[var(--border)] rounded-lg p-1 text-center">
          <div className="font-heading text-sm font-black text-[var(--ember-500)] leading-tight">{score}</div>
          <div className="text-[8px] text-[var(--text-muted)] leading-tight mt-px">score</div>
        </div>
      </div>

      <div className="font-heading text-sm font-bold text-[var(--text-primary)] mb-1.5 leading-snug">
        {title}
      </div>

      <div className="flex gap-3 mb-3">
        <span className="text-xs text-[var(--text-muted)]">📍 {location}</span>
        <span className="text-xs font-semibold text-[color:var(--temp-urgency)]" style={{ '--temp-urgency': urgencyColor } as any}>
          ● {urgency}
        </span>
      </div>

      <div className="flex gap-1.5">
        <div className="flex-1 py-1.75 px-2 text-center bg-[var(--ember-500)] rounded-lg text-xs font-bold text-white font-heading">
          👍 Interested
        </div>
        <div className="flex-1 py-1.75 px-2 text-center bg-[var(--bg-surface-raised)] border border-[var(--border)] rounded-lg text-xs font-semibold text-[var(--text-muted)]">
          Pass
        </div>
      </div>
    </motion.div>
  )
}

// ── Scroll reveal wrapper ──
function Reveal({ children, delay = 0, y = 30 }: { children: React.ReactNode; delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function Home() {
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 600], [0, -80])
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])
  const [activeStep, setActiveStep] = useState(0)

  // Auto-advance steps
  useEffect(() => {
    const t = setInterval(() => setActiveStep(s => (s + 1) % 4), 3000)
    return () => clearInterval(t)
  }, [])

  const { count: leadsCount, ref: leadsRef } = useCounter(500)
  const { count: minutesCount, ref: minutesRef } = useCounter(15)
  const { count: tradiesCount, ref: tradiesRef } = useCounter(3)

  const steps = [
    { icon: '🔍', title: 'We scan the web', desc: 'Flint scrapes 50+ sources every 15 minutes for Australians posting about needing a tradie.', color: '#3B82F6' },
    { icon: '🤖', title: 'AI filters noise', desc: 'Claude AI reads every listing, filtering out ads, spam, and false positives instantly.', color: '#8B5CF6' },
    { icon: '🎯', title: 'Matched to you', desc: 'Leads matched by trade and location. Max 3 tradies per lead — never 50 competitors.', color: '#FF6B35' },
    { icon: '🔔', title: 'You get notified', desc: 'Push to your phone in under 15 minutes. Tap to view, quote or pass.', color: '#22C55E' },
  ]

  return (
    <div className="bg-[var(--bg-base)] text-[var(--text-primary)] min-h-screen overflow-x-hidden">

      {/* ── NAV ── */}
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">

        {/* Background mesh gradient */}
        <div className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,107,53,0.08) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 60%, rgba(255,107,53,0.05) 0%, transparent 60%)',
          }} />

        {/* Subtle grid */}
        <div className="absolute inset-0 z-0 opacity-40"
          style={{
            backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
          }} />

        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 sm:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — text */}
            <motion.div style={{ y: heroY, opacity: heroOpacity }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-[rgba(255,107,53,0.08)] border border-[rgba(255,107,53,0.2)] rounded-full px-3.5 py-1.5 mb-6"
              >
                <motion.div
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-1.5 h-1.5 rounded-full bg-[var(--ember-500)]"
                />
                <span className="text-xs text-[var(--ember-500)] font-semibold tracking-wider">
                  AI-powered leads · Australian tradies
                </span>
              </motion.div>


              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
                className="font-display text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-black leading-none tracking-wide mb-6"
              >
                <div>Stop chasing</div>

                <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] bg-clip-text text-transparent">
                  jobs.
                </div>

                <div className="text-3xl sm:text-4xl lg:text-6xl">
                  Let them find you.
                </div>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25 }}
                className="text-base sm:text-lg lg:text-xl text-[var(--text-secondary)] leading-relaxed mb-9 max-w-md"
              >
                Flint scans the web every 15 minutes for Australians posting job requests — and sends them straight to your phone before anyone else.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="flex flex-col sm:flex-row gap-3 flex-wrap"
              >
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Link href="/signup" className="inline-block bg-gradient-to-br from-[#FF6B35] to-[#E85A24] text-white px-8 py-4 rounded-lg text-base font-bold font-heading shadow-lg shadow-[rgba(255,107,53,0.4)] hover:shadow-xl transition-shadow w-fit">
                    Start free trial →
                  </Link>
                </motion.div>
                <motion.a
                  href="#how"
                  whileHover={{ scale: 1.03, y: -1 }}
                  className="inline-block bg-[var(--bg-surface)] text-[var(--text-secondary)] px-7 py-4 rounded-lg text-base font-semibold border border-[var(--border)] hover:bg-[var(--bg-surface-raised)] transition-colors w-fit"
                >
                  See how it works ↓
                </motion.a>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-9 flex-wrap"
              >
                {['No credit card', 'Cancel anytime', '3-day free trial'].map((badge) => (
                  <div key={badge} className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--text-muted)]">
                    <span className="text-[#22C55E] font-bold">✓</span> {badge}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — floating cards */}
            <div className="relative h-96 sm:h-[550px] items-center justify-center hidden lg:flex">
              <LeadCard
                delay={0.4}
                title="Burst pipe under kitchen sink — urgent"
                trade="🔧 Plumber"
                location="Parramatta, NSW"
                urgency="Emergency"
                score={92}
                style={{ top: '20px', left: '0px', zIndex: 3 }}
              />
              <LeadCard
                delay={0.6}
                title="Bathroom renovation quote needed ASAP"
                trade="🪟 Tiler"
                location="Richmond, VIC"
                urgency="This week"
                score={78}
                style={{ top: '200px', right: '0px', zIndex: 2 }}
              />
              <LeadCard
                delay={0.8}
                title="Garden cleanup before Christmas"
                trade="🌿 Landscaper"
                location="Fortitude Valley, QLD"
                urgency="Planning"
                score={65}
                style={{ bottom: '10px', left: '20px', zIndex: 1 }}
              />

              {/* Notification popup */}
              <motion.div
                initial={{ opacity: 0, x: 40, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 1.2, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="absolute top-16 -right-2.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-3 shadow-xl z-10 w-52"
              >
                <div className="flex gap-2.5 items-center">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#E85A24] flex items-center justify-center text-base flex-shrink-0">
                    🔔
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--text-primary)]">New lead matched!</div>
                    <div className="text-xs text-[var(--text-muted)]">2 min ago · Parramatta NSW</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-t border-b border-[var(--border)] bg-[var(--bg-surface)] py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
          {[
            { ref: leadsRef, value: leadsCount, suffix: '+', label: 'Leads found this week' },
            { ref: minutesRef, value: minutesCount, suffix: ' min', label: 'Average delivery time' },
            { ref: tradiesRef, value: tradiesCount, suffix: ' max', label: 'Tradies per lead' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              ref={stat.ref}
              className="text-center py-4 sm:py-0 px-4 sm:px-6"
            >
              <div className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--ember-500)] leading-none -tracking-wider">
                {stat.value}{stat.suffix}
              </div>
              <div className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5 sm:mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-[120px] px-6" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="max-w-[1100px] mx-auto">
          <Reveal>
            <div className="text-center mb-[72px]">
              <div className="inline-block text-xs font-bold tracking-[3px] uppercase mb-4" style={{ color: 'var(--ember-500)' }}>The process</div>
              <h2 className="text-[clamp(36px,5vw,56px)] font-black tracking-[-2px] leading-[1.05] mb-4"
                style={{ fontFamily: 'var(--font-heading)' }}>
                From posted to your<br />phone in 15 minutes
              </h2>
              <p className="text-lg max-w-[460px] mx-auto" style={{ color: 'var(--text-secondary)' }}>
                Four steps. Fully automated. No work on your end.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Step list */}
            <div className="flex flex-col gap-3">
              {steps.map((step, i) => (
                <Reveal key={step.title} delay={i * 0.1}>
                  <motion.div
                    onClick={() => setActiveStep(i)}
                    whileHover={{ x: 4 }}
                    className="p-6 rounded-[14px] cursor-pointer transition-all duration-300"
                    style={{
                      backgroundColor: activeStep === i ? 'var(--bg-surface)' : 'transparent',
                      border: `1px solid ${activeStep === i ? 'var(--border-strong)' : 'transparent'}`,
                    }}
                  >
                    <div className="flex gap-4 items-start">
                      <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-xl transition-all duration-300"
                        style={{
                          backgroundColor: activeStep === i ? step.color + '20' : 'var(--bg-surface-raised)',
                          border: `1px solid ${activeStep === i ? step.color + '40' : 'var(--border)'}`,
                        }}>
                        {step.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-[10px] mb-[6px]">
                          <span className="text-[10px] font-extrabold tracking-[2px] transition-colors duration-300"
                            style={{ color: activeStep === i ? step.color : 'var(--text-muted)' }}>
                            0{i + 1}
                          </span>
                          <h3 className="text-base font-bold transition-colors duration-300"
                            style={{ fontFamily: 'var(--font-heading)', color: activeStep === i ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {step.title}
                          </h3>
                        </div>
                        <AnimatePresence>
                          {activeStep === i && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-sm leading-[1.6]"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              {step.desc}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                </Reveal>
              ))}
            </div>

            {/* Step visual */}
            <div className="sticky top-[100px] hidden lg:block">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 20, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.96 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="rounded-[20px] p-12 text-center"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    boxShadow: `0 20px 60px ${steps[activeStep].color}15`,
                  }}
                >
                  <div className="w-20 h-20 rounded-[20px] mx-auto mb-5 flex items-center justify-center text-[36px]"
                    style={{ backgroundColor: steps[activeStep].color + '15', border: `2px solid ${steps[activeStep].color}30` }}>
                    {steps[activeStep].icon}
                  </div>
                  <h3 className="text-2xl font-extrabold mb-3 tracking-[-0.5px]"
                    style={{ fontFamily: 'var(--font-heading)' }}>
                    {steps[activeStep].title}
                  </h3>
                  <p className="leading-[1.7] text-[15px]" style={{ color: 'var(--text-secondary)' }}>
                    {steps[activeStep].desc}
                  </p>
                  <div className="flex gap-2 justify-center mt-7">
                    {steps.map((_, i) => (
                      <motion.div key={i}
                        animate={{ width: i === activeStep ? 24 : 6, backgroundColor: i === activeStep ? steps[activeStep].color : 'var(--border-strong)' }}
                        className="h-[6px] rounded-[3px] cursor-pointer"
                        onClick={() => setActiveStep(i)}
                      />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-[120px] px-6" style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)' }}>
        <div className="max-w-[1000px] mx-auto">
          <Reveal>
            <div className="text-center mb-[72px]">
              <div className="text-xs font-bold tracking-[3px] uppercase mb-4" style={{ color: 'var(--ember-500)' }}>Pricing</div>
              <h2 className="text-[clamp(36px,5vw,56px)] font-black tracking-[-2px] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                Simple. Flat rate.<br />No per-lead fees.
              </h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Cancel anytime. No contracts. No surprises.</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: 'Spark', price: '$19', period: '/mo', leads: '5 leads / month', features: ['Push notifications', 'Lead detail view', 'Email support', '25km radius'], highlight: false, color: '#3B82F6' },
              { name: 'Blaze', price: '$39', period: '/mo', leads: '15 leads / month', features: ['Everything in Spark', 'Priority matching', 'AI quote hints', 'Phone support', '50km radius'], highlight: true, color: '#FF6B35' },
              { name: 'Inferno', price: '$69', period: '/mo', leads: 'Unlimited leads', features: ['Everything in Blaze', 'First access to leads', 'Account manager', 'Unlimited radius'], highlight: false, color: '#EF4444' },
            ].map((plan, i) => (
              <Reveal key={plan.name} delay={i * 0.1}>
                <motion.div whileHover={{ y: -6 }}
                  className="rounded-[20px] p-9 relative"
                  style={{
                    backgroundColor: plan.highlight ? 'var(--ember-500)' : 'var(--bg-base)',
                    border: `1px solid ${plan.highlight ? 'var(--ember-500)' : 'var(--border)'}`,
                    boxShadow: plan.highlight ? '0 24px 64px rgba(255,107,53,0.3)' : '0 4px 20px rgba(0,0,0,0.05)',
                  }}
                >
                  {plan.highlight && (
                    <div className="absolute top-[-13px] left-1/2 -translate-x-1/2 text-[10px] font-extrabold px-4 py-1 rounded-full whitespace-nowrap text-white tracking-[1.5px]"
                      style={{ backgroundColor: 'var(--charcoal-900)' }}>
                      MOST POPULAR
                    </div>
                  )}
                  <div className="text-[13px] font-bold tracking-[1px] mb-2"
                    style={{ color: plan.highlight ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>
                    {plan.name.toUpperCase()}
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-[52px] font-black tracking-[-3px] leading-none"
                      style={{ fontFamily: 'var(--font-heading)', color: plan.highlight ? 'white' : 'var(--text-primary)' }}>
                      {plan.price}
                    </span>
                    <span className="text-[15px]" style={{ color: plan.highlight ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                      {plan.period}
                    </span>
                  </div>
                  <div className="text-[13px] mb-7" style={{ color: plan.highlight ? 'rgba(255,255,255,0.65)' : 'var(--text-muted)' }}>
                    {plan.leads}
                  </div>
                  <div className="flex flex-col gap-[10px] mb-8">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-[10px] text-sm"
                        style={{ color: plan.highlight ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)' }}>
                        <span className="text-xs font-bold" style={{ color: plan.highlight ? 'white' : '#22C55E' }}>✓</span> {f}
                      </div>
                    ))}
                  </div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link href="/signup"
                      className="block text-center py-[13px] rounded-[10px] text-sm font-bold no-underline"
                      style={{
                        backgroundColor: plan.highlight ? 'white' : 'var(--ember-500)',
                        color: plan.highlight ? 'var(--ember-600)' : 'white',
                        fontFamily: 'var(--font-heading)',
                        boxShadow: plan.highlight ? '0 4px 16px rgba(0,0,0,0.15)' : '0 4px 14px rgba(255,107,53,0.3)',
                      }}>
                      Start free trial
                    </Link>
                  </motion.div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-[120px] px-6" style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-base)' }}>
        <div className="max-w-[1100px] mx-auto">
          <Reveal>
            <h2 className="text-[clamp(36px,5vw,56px)] font-black tracking-[-2px] text-center mb-[72px]"
              style={{ fontFamily: 'var(--font-heading)' }}>
              Tradies love Flint
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: "Got 3 jobs in my first week. Cancelled HiPages the same day. Best $39 I spend every month.", name: "Dave K.", trade: "Plumber · Sydney", avatar: "DK" },
              { quote: "The leads are real people, not tyre kickers. I've won 8 jobs in 6 weeks through Flint alone.", name: "Marcus T.", trade: "Electrician · Melbourne", avatar: "MT" },
              { quote: "By the time competitors see a lead on HiPages, I've already quoted. Speed is everything in this game.", name: "Sandra R.", trade: "Painter · Brisbane", avatar: "SR" },
            ].map((t, i) => (
              <Reveal key={t.name} delay={i * 0.1}>
                <motion.div whileHover={{ y: -4 }}
                  className="rounded-[20px] p-8"
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}
                >
                  <div className="flex gap-1 mb-5">
                    {[...Array(5)].map((_, j) => (
                      <span key={j} className="text-sm" style={{ color: '#F59E0B' }}>★</span>
                    ))}
                  </div>
                  <p className="text-[15px] leading-[1.7] mb-6 italic" style={{ color: 'var(--text-secondary)' }}>"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-xs font-extrabold text-white"
                      style={{ background: 'linear-gradient(135deg, var(--ember-500), var(--ember-600))', fontFamily: 'var(--font-heading)' }}>
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{t.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.trade}</div>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-[120px] px-6 relative overflow-hidden" style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 100%, rgba(255,107,53,0.08) 0%, transparent 70%)' }} />
        <Reveal>
          <div className="max-w-[640px] mx-auto text-center relative z-[1]">
            <h2 className="text-[clamp(40px,6vw,68px)] font-black tracking-[-3px] leading-[1.0] mb-5"
              style={{ fontFamily: 'var(--font-heading)' }}>
              Your next job is<br />
              <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                already out there.
              </span>
            </h2>
            <p className="text-lg mb-10 leading-[1.7]" style={{ color: 'var(--text-secondary)' }}>
              Start your free trial today. No credit card required.
            </p>
            <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }} className="inline-block">
              <Link href="/signup"
                className="inline-block px-[48px] sm:px-[52px] py-[16px] sm:py-[18px] rounded-[14px] text-lg font-extrabold text-white no-underline tracking-[-0.3px]"
                style={{ background: 'linear-gradient(135deg, #FF6B35, #E85A24)', fontFamily: 'var(--font-heading)', boxShadow: '0 12px 40px rgba(255,107,53,0.4)' }}>
                Get started free →
              </Link>
            </motion.div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 md:py-8 py-7 lg:py-10" style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-base)' }}>
        <div className="max-w-[1100px] mx-auto flex sm:flex-row flex-col flex-wrap justify-between items-center md:gap-3 gap-2.5 lg:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-[23px] h-[23px] sm:w-[26px] sm:h-[26px] rounded-[6px] flex items-center justify-center text-[13px] font-extrabold text-white"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #E85A24)', fontFamily: 'var(--font-heading)' }}>F</div>
            <span className="font-extrabold text-sm sm:text-[15px]" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}>Flint</span>
          </div>
          <div className="text-[12px] sm:text-[13px]" style={{ color: 'var(--text-muted)' }}>© 2025 Flint. Built for Australian tradies.</div>
          <div className="flex sm:gap-6 gap-4">
            {['Privacy', 'Terms', 'Contact'].map((link) => (
              <motion.a key={link} href="#" whileHover={{ color: 'var(--text-primary)' }}
                className="text-[12px] sm:text-[13px] no-underline" style={{ color: 'var(--text-muted)' }}>
                {link}
              </motion.a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}