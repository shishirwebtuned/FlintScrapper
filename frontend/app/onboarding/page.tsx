'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const TRADES = [
    { slug: 'plumber', label: 'Plumber', icon: '🔧' },
    { slug: 'gasfitter', label: 'Gasfitter', icon: '🔥' },
    { slug: 'electrician', label: 'Electrician', icon: '⚡' },
    { slug: 'painter', label: 'Painter', icon: '🎨' },
    { slug: 'cleaner', label: 'Cleaner', icon: '🧹' },
    { slug: 'landscaper', label: 'Landscaper', icon: '🌿' },
    { slug: 'handyman', label: 'Handyman', icon: '🪛' },
    { slug: 'tiler', label: 'Tiler', icon: '🪟' },
    { slug: 'builder', label: 'Builder', icon: '🏗️' },
    { slug: 'carpenter', label: 'Carpenter', icon: '🪚' },
    { slug: 'roofer', label: 'Roofer', icon: '🏠' },
    { slug: 'concreter', label: 'Concreter', icon: '🧱' },
    { slug: 'plasterer', label: 'Plasterer', icon: '🪣' },
    { slug: 'fencer', label: 'Fencer', icon: '🪵' },
    { slug: 'glazier', label: 'Glazier', icon: '🪞' },
    { slug: 'locksmith', label: 'Locksmith', icon: '🔑' },
    { slug: 'pest_control', label: 'Pest Control', icon: '🐛' },
    { slug: 'hvac', label: 'HVAC / Air Con', icon: '❄️' },
    { slug: 'demolition', label: 'Demolition', icon: '🪓' },
    { slug: 'inspector', label: 'Building Inspector', icon: '📋' },
]

const RADIUS_OPTIONS = [
    { value: 10, label: '10km', desc: 'Local area' },
    { value: 25, label: '25km', desc: 'Most popular' },
    { value: 50, label: '50km', desc: 'Wide range' },
    { value: 100, label: '100km', desc: 'Regional' },
]

export default function OnboardingPage() {
    const [step, setStep] = useState(1)
    const [selectedTrades, setSelectedTrades] = useState<string[]>([])
    const [postcode, setPostcode] = useState('')
    const [suburb, setSuburb] = useState('')
    const [radius, setRadius] = useState(25)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const router = useRouter()
    const supabase = createClient()

    //for multiple selection:
    // function toggleTrade(slug: string) {
    //     setSelectedTrades((prev) =>
    //         prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug]
    //     )
    // }


    // Only one trade at a time
    function toggleTrade(slug: string) {
        setSelectedTrades((prev) =>
            prev.includes(slug) ? [] : [slug]
        )
    }

    async function handleFinish() {
        if (!postcode || postcode.length !== 4) {
            return setError('Enter a valid 4-digit Australian postcode.')
        }
        if (selectedTrades.length === 0) {
            return setError('Select at least one trade.')
        }

        setLoading(true)
        setError('')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data: postcodeData } = await supabase
            .from('au_postcodes')
            .select('latitude, longitude, suburb, state')
            .eq('postcode', postcode)
            .limit(1)
            .maybeSingle()

        const updateData: Record<string, unknown> = {
            trade_types: selectedTrades,
            base_postcode: postcode,
            service_radius_km: radius,
            onboarding_complete: true,
        }

        if (postcodeData) {
            updateData.base_suburb = suburb || postcodeData.suburb
            updateData.base_location = `POINT(${postcodeData.longitude} ${postcodeData.latitude})`
        } else {
            // No postcode match — save without location, still complete onboarding
            updateData.base_suburb = suburb || null
            console.warn('Postcode not found in au_postcodes:', postcode)
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id)

        if (updateError) {
            setError('Something went wrong. Please try again.')
            setLoading(false)
            return
        }

        router.push('/feed')
        router.refresh()
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

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '13px',
        fontWeight: 600,
        marginBottom: '8px',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-heading)',
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--bg-base)',
            padding: '0',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* ── TOP BAR ── */}
            <div style={{
                borderBottom: '1px solid var(--border)',
                padding: '0 32px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-base)',
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '30px', height: '30px', borderRadius: '8px',
                        background: 'linear-gradient(135deg, #FF6B35, #E85A24)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-display)', fontWeight: 800,
                        color: 'white', fontSize: '15px',
                        boxShadow: '0 3px 10px rgba(255,107,53,0.3)',
                    }}>F</div>
                    <span style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800, fontSize: '17px',
                        color: 'var(--text-primary)', letterSpacing: '-0.5px',
                    }}>Flint</span>
                </div>

                {/* Step indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {[1, 2].map((s) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <motion.div
                                animate={{
                                    backgroundColor: s < step ? '#22C55E' : s === step ? '#FF6B35' : 'var(--bg-surface-raised)',
                                    scale: s === step ? 1.1 : 1,
                                }}
                                style={{
                                    width: '24px', height: '24px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '11px', fontWeight: 700,
                                    color: s <= step ? 'white' : 'var(--text-muted)',
                                    border: s > step ? '1px solid var(--border)' : 'none',
                                }}
                            >
                                {s < step ? '✓' : s}
                            </motion.div>
                            {s < 2 && (
                                <div style={{
                                    width: '32px', height: '2px', borderRadius: '1px',
                                    backgroundColor: s < step ? '#22C55E' : 'var(--border)',
                                    transition: 'background-color 0.4s',
                                }} />
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Step {step} of 2
                </div>
            </div>

            {/* ── CONTENT ── */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                padding: '48px 24px',
                overflowY: 'auto',
            }}>
                <div style={{ width: '100%', maxWidth: '560px' }}>
                    <AnimatePresence mode="wait">

                        {/* ── STEP 1 — Trades ── */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                            >
                                <div style={{ marginBottom: '32px' }}>
                                    <div style={{
                                        fontSize: '12px', fontWeight: 700,
                                        color: 'var(--ember-500)', letterSpacing: '2px',
                                        textTransform: 'uppercase', marginBottom: '10px',
                                        fontFamily: 'var(--font-mono)',
                                    }}>Step 1 of 2</div>
                                    <h1 style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: 'clamp(28px, 4vw, 40px)',
                                        fontWeight: 900, letterSpacing: '-2px',
                                        lineHeight: 1.05, marginBottom: '10px',
                                        color: 'var(--text-primary)',
                                    }}>What trades do you do?</h1>
                                    <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                        Select all that apply — we'll match you to the right jobs.
                                    </p>
                                </div>

                                {/* Trade grid */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '8px',
                                    marginBottom: '24px',
                                }}>
                                    {TRADES.map((trade, i) => {
                                        const selected = selectedTrades.includes(trade.slug)
                                        return (
                                            <motion.button
                                                key={trade.slug}
                                                onClick={() => toggleTrade(trade.slug)}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.02, duration: 0.3 }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.97 }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '12px 14px',
                                                    borderRadius: '12px',
                                                    border: `1px solid ${selected ? 'var(--ember-500)' : 'var(--border)'}`,
                                                    backgroundColor: selected
                                                        ? 'rgba(255,107,53,0.08)'
                                                        : 'var(--bg-surface)',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    transition: 'all 0.15s ease',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {/* Selected checkmark */}
                                                {selected && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        style={{
                                                            position: 'absolute', top: '6px', right: '6px',
                                                            width: '16px', height: '16px', borderRadius: '50%',
                                                            backgroundColor: 'var(--ember-500)',
                                                            display: 'flex', alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '9px', color: 'white', fontWeight: 700,
                                                        }}
                                                    >✓</motion.div>
                                                )}
                                                <span style={{ fontSize: '20px', lineHeight: 1 }}>{trade.icon}</span>
                                                <span style={{
                                                    fontSize: '13px', fontWeight: 600,
                                                    color: selected ? 'var(--ember-500)' : 'var(--text-secondary)',
                                                    fontFamily: 'var(--font-heading)',
                                                    transition: 'color 0.15s',
                                                }}>{trade.label}</span>
                                            </motion.button>
                                        )
                                    })}
                                </div>

                                {/* Selected count badge */}
                                <AnimatePresence>
                                    {selectedTrades.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 8 }}
                                            style={{
                                                display: 'flex', alignItems: 'center',
                                                gap: '8px', marginBottom: '16px',
                                                padding: '10px 14px',
                                                backgroundColor: 'rgba(255,107,53,0.06)',
                                                border: '1px solid rgba(255,107,53,0.15)',
                                                borderRadius: '10px',
                                            }}
                                        >
                                            <span style={{
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: '13px', fontWeight: 600,
                                                color: 'var(--ember-500)',
                                            }}>
                                                {/* {selectedTrades.length} trade{selectedTrades.length > 1 ? 's' : ''} selected */}

                                                {selectedTrades[0] && `${TRADES.find(t => t.slug === selectedTrades[0])?.label} selected`}
                                            </span>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                {selectedTrades.slice(0, 5).map((slug) => {
                                                    const t = TRADES.find(t => t.slug === slug)
                                                    return t ? (
                                                        <span key={slug} style={{ fontSize: '14px' }}>{t.icon}</span>
                                                    ) : null
                                                })}
                                                {selectedTrades.length > 5 && (
                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                        +{selectedTrades.length - 5} more
                                                    </span>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Error */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            style={{
                                                marginBottom: '16px', padding: '12px 14px',
                                                borderRadius: '10px', fontSize: '13px',
                                                backgroundColor: 'rgba(239,68,68,0.08)',
                                                color: '#DC2626',
                                                border: '1px solid rgba(239,68,68,0.2)',
                                            }}
                                        >⚠️ {error}</motion.div>
                                    )}
                                </AnimatePresence>

                                <motion.button
                                    onClick={() => {
                                        if (selectedTrades.length === 0) return setError('Select at least one trade.')
                                        setError('')
                                        setStep(2)
                                    }}
                                    whileHover={{ scale: 1.02, y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        width: '100%', padding: '14px',
                                        borderRadius: '12px', border: 'none',
                                        fontSize: '15px', fontWeight: 700,
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-display)',
                                        background: 'linear-gradient(135deg, #FF6B35, #E85A24)',
                                        color: 'white',
                                        boxShadow: '0 6px 20px rgba(255,107,53,0.35)',
                                        letterSpacing: '-0.2px',
                                    }}
                                >
                                    Next — Set your location →
                                </motion.button>
                            </motion.div>
                        )}

                        {/* ── STEP 2 — Location ── */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                            >
                                <div style={{ marginBottom: '32px' }}>
                                    <div style={{
                                        fontSize: '12px', fontWeight: 700,
                                        color: 'var(--ember-500)', letterSpacing: '2px',
                                        textTransform: 'uppercase', marginBottom: '10px',
                                        fontFamily: 'var(--font-mono)',
                                    }}>Step 2 of 2</div>
                                    <h1 style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: 'clamp(28px, 4vw, 40px)',
                                        fontWeight: 900, letterSpacing: '-2px',
                                        lineHeight: 1.05, marginBottom: '10px',
                                        color: 'var(--text-primary)',
                                    }}>Where are you based?</h1>
                                    <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                        We'll only send you leads within your service area.
                                    </p>
                                </div>

                                {/* Selected trades summary */}
                                <div style={{
                                    padding: '14px 16px',
                                    backgroundColor: 'var(--bg-surface)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px', marginBottom: '24px',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                            Your trades
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {selectedTrades.map((slug) => {
                                                const t = TRADES.find(t => t.slug === slug)
                                                return t ? (
                                                    <span key={slug} style={{
                                                        fontSize: '12px', fontWeight: 600,
                                                        color: 'var(--ember-500)',
                                                        backgroundColor: 'rgba(255,107,53,0.08)',
                                                        border: '1px solid rgba(255,107,53,0.15)',
                                                        padding: '2px 8px', borderRadius: '100px',
                                                    }}>{t.icon} {t.label}</span>
                                                ) : null
                                            })}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setStep(1)}
                                        style={{
                                            background: 'none', border: 'none',
                                            cursor: 'pointer', fontSize: '12px',
                                            color: 'var(--text-muted)', fontFamily: 'var(--font-sans)',
                                            textDecoration: 'underline', flexShrink: 0,
                                        }}
                                    >Edit</button>
                                </div>

                                {/* Postcode */}
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Your postcode</label>
                                    <input
                                        type="text"
                                        value={postcode}
                                        onChange={(e) => setPostcode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="e.g. 2000"
                                        maxLength={4}
                                        style={inputStyle}
                                        onFocus={(e) => e.target.style.borderColor = 'var(--ember-500)'}
                                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                    />
                                </div>

                                {/* Suburb */}
                                <div style={{ marginBottom: '28px' }}>
                                    <label style={labelStyle}>
                                        Suburb{' '}
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={suburb}
                                        onChange={(e) => setSuburb(e.target.value)}
                                        placeholder="e.g. Parramatta"
                                        style={inputStyle}
                                        onFocus={(e) => e.target.style.borderColor = 'var(--ember-500)'}
                                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                    />
                                </div>

                                {/* Radius */}
                                <div style={{ marginBottom: '28px' }}>
                                    <label style={labelStyle}>How far will you travel?</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                        {RADIUS_OPTIONS.map((r) => (
                                            <motion.button
                                                key={r.value}
                                                onClick={() => setRadius(r.value)}
                                                whileHover={{ scale: 1.04 }}
                                                whileTap={{ scale: 0.96 }}
                                                style={{
                                                    padding: '12px 8px',
                                                    borderRadius: '12px',
                                                    border: `1px solid ${radius === r.value ? 'var(--ember-500)' : 'var(--border)'}`,
                                                    backgroundColor: radius === r.value
                                                        ? 'rgba(255,107,53,0.08)'
                                                        : 'var(--bg-surface)',
                                                    cursor: 'pointer',
                                                    textAlign: 'center',
                                                    transition: 'all 0.15s ease',
                                                }}
                                            >
                                                <div style={{
                                                    fontFamily: 'var(--font-mono)',
                                                    fontSize: '15px', fontWeight: 700,
                                                    color: radius === r.value ? 'var(--ember-500)' : 'var(--text-primary)',
                                                    lineHeight: 1, marginBottom: '3px',
                                                }}>{r.label}</div>
                                                <div style={{
                                                    fontSize: '10px',
                                                    color: radius === r.value ? 'var(--ember-500)' : 'var(--text-muted)',
                                                    fontWeight: 500,
                                                }}>{r.desc}</div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Error */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            style={{
                                                marginBottom: '16px', padding: '12px 14px',
                                                borderRadius: '10px', fontSize: '13px',
                                                backgroundColor: 'rgba(239,68,68,0.08)',
                                                color: '#DC2626',
                                                border: '1px solid rgba(239,68,68,0.2)',
                                            }}
                                        >⚠️ {error}</motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Buttons */}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <motion.button
                                        onClick={() => { setStep(1); setError('') }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        style={{
                                            flex: '0 0 auto',
                                            padding: '14px 20px',
                                            borderRadius: '12px', border: '1px solid var(--border)',
                                            backgroundColor: 'var(--bg-surface)',
                                            color: 'var(--text-secondary)',
                                            fontSize: '14px', fontWeight: 600,
                                            cursor: 'pointer',
                                            fontFamily: 'var(--font-heading)',
                                        }}
                                    >← Back</motion.button>

                                    <motion.button
                                        onClick={handleFinish}
                                        disabled={loading}
                                        whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
                                        whileTap={!loading ? { scale: 0.98 } : {}}
                                        style={{
                                            flex: 1, padding: '14px',
                                            borderRadius: '12px', border: 'none',
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
                                                Setting up your account...
                                            </span>
                                        ) : 'Go to my leads →'}
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}