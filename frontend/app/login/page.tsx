'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import AppLogo from '@/components/AppLogo'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [mode, setMode] = useState<'password' | 'magic'>('password')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
    const [showPassword, setShowPassword] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    async function handlePasswordLogin() {
        setLoading(true)
        setMessage(null)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            setMessage({ type: 'error', text: error.message })
        } else {
            router.push('/feed')
            router.refresh()
        }
        setLoading(false)
    }

    async function handleMagicLink() {
        setLoading(true)
        setMessage(null)
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${window.location.origin}/feed` }
        })
        if (error) {
            setMessage({ type: 'error', text: error.message })
        } else {
            setMessage({ type: 'success', text: 'Check your email — magic link sent.' })
        }
        setLoading(false)
    }

    function handleSubmit() {
        if (!email) return setMessage({ type: 'error', text: 'Enter your email.' })
        if (mode === 'password' && !password) return setMessage({ type: 'error', text: 'Enter your password.' })
        mode === 'password' ? handlePasswordLogin() : handleMagicLink()
    }

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '10px',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s',
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border)',
        fontFamily: 'var(--font-sans)',
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            backgroundColor: 'var(--bg-base)',
        }}>

            {/* ── LEFT PANEL — branding ── */}
            <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                style={{
                    display: 'none',
                    width: '50%',
                    padding: '48px',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--bg-surface)',
                    borderRight: '1px solid var(--border)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
                className="left-panel"
            >
                {/* Background glow */}
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 0,
                    background: 'radial-gradient(ellipse 70% 50% at 30% 80%, rgba(255,107,53,0.08) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />

                {/* Subtle grid */}
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 0,
                    backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                    opacity: 0.5,
                    maskImage: 'radial-gradient(ellipse 100% 100% at 0% 100%, black 20%, transparent 80%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 0% 100%, black 20%, transparent 80%)',
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Logo */}
                    <AppLogo />
                </div>

                {/* Middle — headline */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.7 }}
                    >
                        <h2 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(40px, 4vw, 60px)',
                            fontWeight: 900,
                            lineHeight: 1.0,
                            letterSpacing: '-3px',
                            marginBottom: '20px',
                            color: 'var(--text-primary)',
                        }}>
                            Leads come<br />
                            <span style={{
                                background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>to you.</span>
                        </h2>
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '16px', lineHeight: 1.7,
                            maxWidth: '380px',
                        }}>
                            Flint finds real job requests posted by Australians looking for tradies — and delivers them straight to your phone before anyone else sees them.
                        </p>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35, duration: 0.6 }}
                        style={{ display: 'flex', gap: '32px', marginTop: '40px' }}
                    >
                        {[
                            { value: '50+', label: 'Sources scraped' },
                            { value: '<15m', label: 'Lead delivery' },
                            { value: '3 max', label: 'Tradies per lead' },
                        ].map((stat) => (
                            <div key={stat.label}>
                                <div style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '22px', fontWeight: 600,
                                    color: 'var(--ember-500)', letterSpacing: '-1px',
                                }}>{stat.value}</div>
                                <div style={{
                                    fontSize: '12px', color: 'var(--text-muted)',
                                    marginTop: '3px',
                                }}>{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Bottom quote */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{
                        position: 'relative', zIndex: 1,
                        borderTop: '1px solid var(--border)',
                        paddingTop: '24px',
                    }}
                >
                    <div style={{
                        fontSize: '24px', color: 'var(--ember-500)',
                        fontFamily: 'Georgia, serif', lineHeight: 1,
                        marginBottom: '10px',
                    }}>"</div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>
                        Got 3 jobs in my first week. Cancelled HiPages the same day.
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                        — Dave, Plumber, Sydney
                    </p>
                </motion.div>
            </motion.div>

            {/* ── RIGHT PANEL — form ── */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '48px 32px',
                }}
            >
                <div style={{ width: '100%', maxWidth: '380px', margin: '0 auto' }}>

                    {/* Mobile logo */}
                    <div className="mb-[26px] mobile-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #FF6B35, #E85A24)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-display)', fontWeight: 800,
                            color: 'white', fontSize: '16px',
                        }}>F</div>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--text-primary)' }}>Flint</span>
                    </div>


                    {/* Header */}
                    <div style={{ marginBottom: '32px' }}>
                        <h1 className="text-[28px] mt-0 leading-tight md:leading-none" style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '28px', fontWeight: 800,
                            letterSpacing: '-1px', marginBottom: '6px',
                            color: 'var(--text-primary)',
                        }}>Welcome back</h1>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Sign in to see your leads
                        </p>
                    </div>

                    {/* Mode toggle */}
                    <div style={{
                        display: 'flex',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '4px',
                        marginBottom: '24px',
                    }}>
                        {(['password', 'magic'] as const).map((m) => (
                            <motion.button
                                key={m}
                                onClick={() => { setMode(m); setMessage(null) }}
                                whileTap={{ scale: 0.97 }}
                                style={{
                                    flex: 1, padding: '9px 12px',
                                    borderRadius: '9px',
                                    fontSize: '13px', fontWeight: 600,
                                    border: 'none', cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    backgroundColor: mode === m ? 'var(--bg-base)' : 'transparent',
                                    color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                                    boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                                    fontFamily: 'var(--font-sans)',
                                }}
                            >
                                {m === 'password' ? '🔑 Password' : '✨ Magic link'}
                            </motion.button>
                        ))}
                    </div>

                    {/* Email */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block', fontSize: '13px',
                            fontWeight: 600, marginBottom: '8px',
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-heading)',
                        }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            placeholder="you@example.com"
                            style={inputStyle}
                            onFocus={(e) => e.target.style.borderColor = 'var(--ember-500)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                        />
                    </div>

                    {/* Password */}
                    <AnimatePresence>
                        {mode === 'password' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ marginBottom: '24px', overflow: 'hidden' }}
                            >
                                <label style={{
                                    display: 'block', fontSize: '13px',
                                    fontWeight: 600, marginBottom: '8px',
                                    color: 'var(--text-secondary)',
                                    fontFamily: 'var(--font-heading)',
                                }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                        placeholder="••••••••"
                                        style={{ ...inputStyle, paddingRight: '44px' }}
                                        onFocus={(e) => e.target.style.borderColor = 'var(--ember-500)'}
                                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute', right: '12px',
                                            top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none',
                                            cursor: 'pointer', padding: '4px',
                                            color: 'var(--text-muted)',
                                            display: 'flex', alignItems: 'center',
                                        }}
                                    >
                                        {showPassword ? (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Magic link hint */}
                    <AnimatePresence>
                        {mode === 'magic' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{
                                    marginBottom: '24px', overflow: 'hidden',
                                    padding: '12px 14px',
                                    backgroundColor: 'var(--bg-surface)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '10px',
                                    fontSize: '13px',
                                    color: 'var(--text-secondary)',
                                    lineHeight: 1.6,
                                }}
                            >
                                ✨ We'll email you a one-click link — no password needed.
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Message */}
                    <AnimatePresence>
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    marginBottom: '16px',
                                    padding: '12px 14px',
                                    borderRadius: '10px',
                                    fontSize: '13px',
                                    backgroundColor: message.type === 'error'
                                        ? 'rgba(239,68,68,0.08)'
                                        : 'rgba(34,197,94,0.08)',
                                    color: message.type === 'error' ? '#DC2626' : '#16A34A',
                                    border: `1px solid ${message.type === 'error'
                                        ? 'rgba(239,68,68,0.2)'
                                        : 'rgba(34,197,94,0.2)'}`,
                                }}
                            >
                                {message.type === 'error' ? '⚠️ ' : '✅ '}{message.text}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit */}
                    <motion.button
                        onClick={handleSubmit}
                        disabled={loading}
                        whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
                        whileTap={!loading ? { scale: 0.98 } : {}}
                        style={{
                            width: '100%', padding: '13px',
                            borderRadius: '10px', border: 'none',
                            fontSize: '15px', fontWeight: 700,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--font-display)',
                            letterSpacing: '-0.2px',
                            background: loading
                                ? 'var(--bg-surface-raised)'
                                : 'linear-gradient(135deg, #FF6B35, #E85A24)',
                            color: loading ? 'var(--text-muted)' : 'white',
                            boxShadow: loading ? 'none' : '0 6px 20px rgba(255,107,53,0.35)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <motion.span
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                    style={{ display: 'inline-block' }}
                                >⟳</motion.span>
                                Please wait...
                            </span>
                        ) : mode === 'password' ? 'Sign in →' : 'Send magic link →'}
                    </motion.button>

                    {/* Divider */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        margin: '24px 0',
                    }}>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>or</span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
                    </div>

                    {/* Footer links */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <Link href="/signup" style={{
                            color: 'var(--text-secondary)',
                            textDecoration: 'none', fontWeight: 500,
                        }}>
                            No account? <span style={{ color: 'var(--ember-500)', fontWeight: 600 }}>Sign up free</span>
                        </Link>
                        <button
                            onClick={() => { setMode('magic'); setMessage(null) }}
                            style={{
                                background: 'none', border: 'none',
                                cursor: 'pointer', fontSize: '13px',
                                color: 'var(--text-secondary)', fontWeight: 500,
                                fontFamily: 'var(--font-sans)',
                            }}
                        >
                            Forgot password?
                        </button>
                    </div>
                </div>
            </motion.div>

            <style>{`
                .left-panel { display: none; }
                .mobile-logo { display: flex; }
                @media (min-width: 1024px) {
                    .left-panel { display: flex !important; }
                    .mobile-logo { display: none !important; }
                }
            `}</style>
        </div>
    )
}