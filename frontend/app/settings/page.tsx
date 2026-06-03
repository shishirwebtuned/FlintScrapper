'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell } from '@/components/AppShell'
import Link from 'next/link'
import { User, Wrench, MapPin, Bell, Zap, Loader, CheckCircle, AlertTriangle } from 'lucide-react'

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
    { value: 10, label: '10km', desc: 'Local' },
    { value: 25, label: '25km', desc: 'Popular' },
    { value: 50, label: '50km', desc: 'Wide' },
    { value: 100, label: '100km', desc: 'Regional' },
]

const PLANS = [
    { id: 'spark', name: 'Spark', price: '$19/mo', leads: '5 leads', color: '#3B82F6' },
    { id: 'blaze', name: 'Blaze', price: '$39/mo', leads: '15 leads', color: '#FF6B35' },
    { id: 'inferno', name: 'Inferno', price: '$69/mo', leads: 'Unlimited', color: '#EF4444' },
]

type Profile = {
    contact_name: string
    business_name: string | null
    email: string | null
    phone: string | null
    abn: string | null
    trade_types: string[]
    base_postcode: string | null
    base_suburb: string | null
    service_radius_km: number
    tier: string
    leads_limit: number
    leads_used_this_month: number
    subscription_status: string
    email_notifications: boolean
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function SettingsPage() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeSection, setActiveSection] = useState<string>('profile')

    // Form state
    const [contactName, setContactName] = useState('')
    const [businessName, setBusinessName] = useState('')
    const [phone, setPhone] = useState('')
    const [abn, setAbn] = useState('')
    const [selectedTrades, setSelectedTrades] = useState<string[]>([])
    const [postcode, setPostcode] = useState('')
    const [radius, setRadius] = useState(25)
    const [emailNotifs, setEmailNotifs] = useState(true)

    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
    const [saveMessage, setSaveMessage] = useState('')
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
    const [cancelLoading, setCancelLoading] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    async function handleCheckout(tier: string) {
        setCheckoutLoading(tier)
        try {
            const res = await fetch('/api/paypal/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier }),
            })
            const { url, error } = await res.json()
            if (error) { alert(error); setCheckoutLoading(null); return }
            window.location.href = url
        } catch {
            alert('Something went wrong. Please try again.')
            setCheckoutLoading(null)
        }
    }

    async function handleCancel() {
        if (!confirm('Are you sure you want to cancel your subscription?')) return
        setCancelLoading(true)
        try {
            const res = await fetch('/api/paypal/cancel-subscription', { method: 'POST' })
            const { error } = await res.json()
            if (error) { alert(error); setCancelLoading(false); return }
            window.location.reload()
        } catch {
            alert('Something went wrong.')
            setCancelLoading(false)
        }
    }

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }

            const { data: prof } = await supabase
                .from('profiles')
                .select('contact_name, business_name, email, phone, abn, trade_types, base_postcode, base_suburb, service_radius_km, tier, leads_limit, leads_used_this_month, subscription_status, email_notifications')
                .eq('id', user.id)
                .maybeSingle()

            if (prof) {
                setProfile(prof)
                setContactName(prof.contact_name || '')
                setBusinessName(prof.business_name || '')
                setPhone(prof.phone || '')
                setAbn(prof.abn || '')
                setSelectedTrades(prof.trade_types || [])
                setPostcode(prof.base_postcode || '')
                setRadius(prof.service_radius_km || 25)
                setEmailNotifs(prof.email_notifications ?? true)
            }

            setLoading(false)
        }
        load()
    }, [router, supabase])

    async function saveProfile() {
        setSaveStatus('saving')
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Geocode new postcode if changed
        let locationUpdate: Record<string, unknown> = {}
        if (postcode && postcode !== profile?.base_postcode && postcode.length === 4) {
            const { data: postcodeData } = await supabase
                .from('au_postcodes')
                .select('latitude, longitude, suburb')
                .eq('postcode', postcode)
                .limit(1)
                .maybeSingle()

            if (postcodeData) {
                locationUpdate = {
                    base_location: `POINT(${postcodeData.longitude} ${postcodeData.latitude})`,
                    base_suburb: postcodeData.suburb,
                }
            }
        }

        const { error } = await supabase
            .from('profiles')
            .update({
                contact_name: contactName,
                business_name: businessName,
                phone,
                abn,
                trade_types: selectedTrades,
                base_postcode: postcode,
                service_radius_km: radius,
                email_notifications: emailNotifs,
                ...locationUpdate,
            })
            .eq('id', user.id)

        if (error) {
            setSaveStatus('error')
            setSaveMessage('Failed to save. Please try again.')
        } else {
            setSaveStatus('saved')
            setSaveMessage('Changes saved successfully.')
            setTimeout(() => setSaveStatus('idle'), 3000)
        }
    }

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '11px 14px',
        borderRadius: '10px', fontSize: '14px',
        outline: 'none', transition: 'border-color 0.2s',
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border)',
        fontFamily: 'var(--font-sans)',
    }

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '13px',
        fontWeight: 600, marginBottom: '7px',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-heading)',
    }

    const sections = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'trades', label: 'Trades', icon: Wrench },
        { id: 'location', label: 'Location', icon: MapPin },
        { id: 'notifs', label: 'Notifications', icon: Bell },
        { id: 'plan', label: 'Plan', icon: Zap },
    ]

    if (loading) {
        return (
            <AppShell>
                <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>
                    {[1, 2, 3].map(i => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                            style={{
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '16px', height: '80px', marginBottom: '12px',
                            }}
                        />
                    ))}
                </div>
            </AppShell>
        )
    }

    return (
        <AppShell>
            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>

                {/* ── Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '28px' }}
                >
                    <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '26px', fontWeight: 900,
                        letterSpacing: '-1px', marginBottom: '4px',
                        color: 'var(--text-primary)',
                    }}>Settings</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Manage your profile, trades, and preferences
                    </p>
                </motion.div>

                {/* ── Section tabs ── */}
                <div style={{
                    display: 'flex', gap: '4px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px', padding: '4px',
                    marginBottom: '24px', overflowX: 'auto',
                }}>
                    {sections.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            style={{
                                flex: '1 0 auto', padding: '8px 12px',
                                borderRadius: '9px', border: 'none',
                                cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                                transition: 'all 0.2s',
                                backgroundColor: activeSection === s.id ? 'var(--bg-base)' : 'transparent',
                                color: activeSection === s.id ? 'var(--text-primary)' : 'var(--text-muted)',
                                boxShadow: activeSection === s.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                                fontFamily: 'var(--font-sans)',
                                display: 'flex', alignItems: 'center', gap: '6px',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <s.icon
                                size={14}
                                strokeWidth={2}
                                color={activeSection === s.id ? 'var(--ember-500)' : 'var(--text-muted)'}
                            />
                            <span className="section-label" style={{
                                color: activeSection === s.id ? 'var(--ember-500)' : 'var(--text-muted)',
                            }}>
                                {s.label}
                            </span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">

                    {/* ── PROFILE SECTION ── */}
                    {activeSection === 'profile' && (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.25 }}
                            style={{
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '16px', padding: '24px',
                            }}
                        >
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
                                Personal details
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={labelStyle}>Your name</label>
                                        <input
                                            value={contactName}
                                            onChange={e => setContactName(e.target.value)}
                                            placeholder="Dave Smith"
                                            style={inputStyle}
                                            onFocus={e => e.target.style.borderColor = 'var(--ember-500)'}
                                            onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Business name</label>
                                        <input
                                            value={businessName}
                                            onChange={e => setBusinessName(e.target.value)}
                                            placeholder="Smith Plumbing"
                                            style={inputStyle}
                                            onFocus={e => e.target.style.borderColor = 'var(--ember-500)'}
                                            onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Phone</label>
                                    <input
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="04XX XXX XXX"
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = 'var(--ember-500)'}
                                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>ABN <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                                    <input
                                        value={abn}
                                        onChange={e => setAbn(e.target.value)}
                                        placeholder="12 345 678 901"
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = 'var(--ember-500)'}
                                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Email</label>
                                    <input
                                        value={profile?.email || ''}
                                        disabled
                                        style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
                                    />
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>
                                        Email cannot be changed here.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── TRADES SECTION ── */}
                    {activeSection === 'trades' && (
                        <motion.div
                            key="trades"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.25 }}
                            style={{
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '16px', padding: '24px',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    Your trades
                                </h2>
                                {selectedTrades.length > 0 && (
                                    <span style={{
                                        fontSize: '12px', fontWeight: 700,
                                        color: 'var(--ember-500)',
                                        backgroundColor: 'rgba(255,107,53,0.08)',
                                        border: '1px solid rgba(255,107,53,0.15)',
                                        padding: '3px 10px', borderRadius: '100px',
                                        fontFamily: 'var(--font-mono)',
                                    }}>
                                        {/* {selectedTrades.length} selected */}

                                        {selectedTrades[0]
                                            ? TRADES.find(t => t.slug === selectedTrades[0])?.label
                                            : '0 selected'}
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                {TRADES.map(trade => {
                                    const selected = selectedTrades.includes(trade.slug)
                                    return (
                                        <motion.button
                                            key={trade.slug}
                                            // onClick={() => setSelectedTrades(prev =>
                                            //     prev.includes(trade.slug)
                                            //         ? prev.filter(t => t !== trade.slug)
                                            //         : [...prev, trade.slug]
                                            // )}

                                            onClick={() => setSelectedTrades(prev =>
                                                prev.includes(trade.slug) ? [] : [trade.slug]
                                            )}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.97 }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '11px 14px', borderRadius: '10px',
                                                border: `1px solid ${selected ? 'var(--ember-500)' : 'var(--border)'}`,
                                                backgroundColor: selected ? 'rgba(255,107,53,0.08)' : 'var(--bg-surface-raised)',
                                                cursor: 'pointer', textAlign: 'left',
                                                position: 'relative',
                                            }}
                                        >
                                            {selected && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    style={{
                                                        position: 'absolute', top: '5px', right: '5px',
                                                        width: '14px', height: '14px', borderRadius: '50%',
                                                        backgroundColor: 'var(--ember-500)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '8px', color: 'white', fontWeight: 700,
                                                    }}
                                                >✓</motion.div>
                                            )}
                                            <span style={{ fontSize: '18px' }}>{trade.icon}</span>
                                            <span style={{
                                                fontSize: '13px', fontWeight: 600,
                                                color: selected ? 'var(--ember-500)' : 'var(--text-secondary)',
                                                fontFamily: 'var(--font-heading)',
                                            }}>{trade.label}</span>
                                        </motion.button>
                                    )
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* ── LOCATION SECTION ── */}
                    {activeSection === 'location' && (
                        <motion.div
                            key="location"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.25 }}
                            style={{
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '16px', padding: '24px',
                            }}
                        >
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
                                Service area
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={labelStyle}>Your postcode</label>
                                    <input
                                        value={postcode}
                                        onChange={e => setPostcode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="e.g. 2000"
                                        maxLength={4}
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = 'var(--ember-500)'}
                                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                    />
                                    {profile?.base_suburb && (
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>
                                            Current: {profile.base_suburb}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label style={labelStyle}>Service radius</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                        {RADIUS_OPTIONS.map(r => (
                                            <motion.button
                                                key={r.value}
                                                onClick={() => setRadius(r.value)}
                                                whileHover={{ scale: 1.04 }}
                                                whileTap={{ scale: 0.96 }}
                                                style={{
                                                    padding: '12px 8px', borderRadius: '10px',
                                                    border: `1px solid ${radius === r.value ? 'var(--ember-500)' : 'var(--border)'}`,
                                                    backgroundColor: radius === r.value ? 'rgba(255,107,53,0.08)' : 'var(--bg-surface-raised)',
                                                    cursor: 'pointer', textAlign: 'center',
                                                }}
                                            >
                                                <div style={{
                                                    fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700,
                                                    color: radius === r.value ? 'var(--ember-500)' : 'var(--text-primary)',
                                                    lineHeight: 1, marginBottom: '3px',
                                                }}>{r.label}</div>
                                                <div style={{
                                                    fontSize: '10px',
                                                    color: radius === r.value ? 'var(--ember-500)' : 'var(--text-muted)',
                                                }}>{r.desc}</div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── NOTIFICATIONS SECTION ── */}
                    {activeSection === 'notifs' && (
                        <motion.div
                            key="notifs"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.25 }}
                            style={{
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '16px', padding: '24px',
                            }}
                        >
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
                                Notifications
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {[
                                    { key: 'email', label: 'Email notifications', desc: 'Get new leads by email', value: emailNotifs, setter: setEmailNotifs },
                                ].map(item => (
                                    <div key={item.key} style={{
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '16px',
                                        backgroundColor: 'var(--bg-surface-raised)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '12px',
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                                                {item.label}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                {item.desc}
                                            </div>
                                        </div>
                                        <motion.button
                                            onClick={() => item.setter(!item.value)}
                                            whileTap={{ scale: 0.95 }}
                                            style={{
                                                width: '44px', height: '24px',
                                                borderRadius: '100px', border: 'none',
                                                backgroundColor: item.value ? 'var(--ember-500)' : 'var(--bg-overlay)',
                                                cursor: 'pointer', position: 'relative',
                                                transition: 'background-color 0.2s',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <motion.div
                                                animate={{ x: item.value ? 20 : 2 }}
                                                transition={{ duration: 0.2 }}
                                                style={{
                                                    position: 'absolute', top: '2px',
                                                    width: '20px', height: '20px',
                                                    borderRadius: '50%',
                                                    backgroundColor: 'white',
                                                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                                                }}
                                            />
                                        </motion.button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── PLAN SECTION ── */}
                    {activeSection === 'plan' && (
                        <motion.div
                            key="plan"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.25 }}
                        >
                            {/* Current plan */}
                            <div style={{
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '16px', padding: '20px',
                                marginBottom: '16px',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'space-between', gap: '12px',
                            }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Current plan</div>
                                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                                        {profile?.tier?.charAt(0).toUpperCase()}{profile?.tier?.slice(1)}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                        {profile?.leads_used_this_month} / {profile?.leads_limit === 9999 ? '∞' : profile?.leads_limit} leads used this month
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: '12px', fontWeight: 800,
                                    backgroundColor: 'rgba(255,107,53,0.1)',
                                    color: 'var(--ember-500)',
                                    padding: '6px 14px', borderRadius: '100px',
                                    border: '1px solid rgba(255,107,53,0.2)',
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                    fontFamily: 'var(--font-mono)',
                                }}>{profile?.subscription_status}</span>
                            </div>

                            {/* Plan options */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {PLANS.map(plan => {
                                    const isCurrent = profile?.tier === plan.id
                                    return (
                                        <motion.div
                                            key={plan.id}
                                            whileHover={!isCurrent ? { scale: 1.01 } : {}}
                                            style={{
                                                backgroundColor: 'var(--bg-surface)',
                                                border: `1px solid ${isCurrent ? plan.color + '40' : 'var(--border)'}`,
                                                borderRadius: '14px', padding: '18px 20px',
                                                display: 'flex', alignItems: 'center',
                                                justifyContent: 'space-between', gap: '12px',
                                                boxShadow: isCurrent ? `0 4px 16px ${plan.color}12` : 'none',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div style={{
                                                    width: '10px', height: '10px', borderRadius: '50%',
                                                    backgroundColor: plan.color, flexShrink: 0,
                                                }} />
                                                <div>
                                                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                        {plan.name}
                                                        {isCurrent && (
                                                            <span style={{
                                                                marginLeft: '8px', fontSize: '11px',
                                                                fontWeight: 700, color: plan.color,
                                                                backgroundColor: plan.color + '15',
                                                                padding: '2px 8px', borderRadius: '100px',
                                                            }}>Current</span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                        {plan.leads} / month
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{
                                                    fontFamily: 'var(--font-mono)',
                                                    fontSize: '15px', fontWeight: 700,
                                                    color: 'var(--text-primary)',
                                                }}>{plan.price}</span>

                                                {!isCurrent ? (
                                                    <motion.button
                                                        onClick={() => handleCheckout(plan.id)}
                                                        disabled={checkoutLoading === plan.id}
                                                        whileHover={{ scale: 1.03 }}
                                                        whileTap={{ scale: 0.97 }}
                                                        style={{
                                                            fontSize: '13px', fontWeight: 700,
                                                            color: 'white',
                                                            backgroundColor: checkoutLoading === plan.id
                                                                ? 'var(--text-muted)' : plan.color,
                                                            padding: '7px 16px', borderRadius: '8px',
                                                            border: 'none',
                                                            cursor: checkoutLoading === plan.id ? 'not-allowed' : 'pointer',
                                                            fontFamily: 'var(--font-heading)',
                                                            whiteSpace: 'nowrap',
                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                        }}
                                                    >
                                                        {checkoutLoading === plan.id ? (
                                                            <>
                                                                <motion.span
                                                                    animate={{ rotate: 360 }}
                                                                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                                                    style={{ display: 'inline-flex' }}
                                                                >
                                                                    <Loader size={12} strokeWidth={2} color="white" />
                                                                </motion.span>
                                                                Redirecting...
                                                            </>
                                                        ) : (
                                                            profile?.tier === 'trial' ||
                                                                PLANS.findIndex(p => p.id === profile?.tier) <
                                                                PLANS.findIndex(p => p.id === plan.id)
                                                                ? 'Upgrade →' : 'Switch'
                                                        )}
                                                    </motion.button>
                                                ) : (
                                                    profile?.subscription_status === 'active' && (
                                                        <motion.button
                                                            onClick={handleCancel}
                                                            disabled={cancelLoading}
                                                            whileHover={{ scale: 1.03 }}
                                                            whileTap={{ scale: 0.97 }}
                                                            style={{
                                                                fontSize: '13px', fontWeight: 600,
                                                                color: '#EF4444',
                                                                backgroundColor: 'rgba(239,68,68,0.08)',
                                                                padding: '7px 16px', borderRadius: '8px',
                                                                border: '1px solid rgba(239,68,68,0.2)',
                                                                cursor: cancelLoading ? 'not-allowed' : 'pointer',
                                                                fontFamily: 'var(--font-heading)',
                                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                            }}
                                                        >
                                                            {cancelLoading ? (
                                                                <>
                                                                    <motion.span
                                                                        animate={{ rotate: 360 }}
                                                                        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                                                        style={{ display: 'inline-flex' }}
                                                                    >
                                                                        <Loader size={12} strokeWidth={2} color="#EF4444" />
                                                                    </motion.span>
                                                                    Cancelling...
                                                                </>
                                                            ) : 'Cancel plan'}
                                                        </motion.button>
                                                    )
                                                )}
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>

                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px', textAlign: 'center' }}>
                                Billing handled securely via PayPal. Cancel anytime.
                            </p>

                        </motion.div>
                    )}

                </AnimatePresence>

                {/* ── Save button (not shown on plan tab) ── */}
                {activeSection !== 'plan' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}
                    >
                        <motion.button
                            className='sm:px-8 sm:py-3 px-6 py-2 sm:text-[15px] text-[13px]'
                            onClick={saveProfile}
                            disabled={saveStatus === 'saving'}
                            whileHover={saveStatus !== 'saving' ? { scale: 1.02, y: -1 } : {}}
                            whileTap={saveStatus !== 'saving' ? { scale: 0.98 } : {}}
                            style={{
                                // padding: '13px 32px', 
                                borderRadius: '12px', border: 'none',
                                fontWeight: 700,
                                cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                                fontFamily: 'var(--font-display)',
                                background: saveStatus === 'saving' ? 'var(--bg-surface-raised)' : 'linear-gradient(135deg, #FF6B35, #E85A24)',
                                color: saveStatus === 'saving' ? 'var(--text-muted)' : 'white',
                                boxShadow: saveStatus === 'saving' ? 'none' : '0 6px 20px rgba(255,107,53,0.35)',
                                transition: 'all 0.2s',
                            }}
                        >
                            {saveStatus === 'saving' ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <motion.span
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                        style={{ display: 'inline-flex' }}
                                    >
                                        <Loader size={14} strokeWidth={2} color="var(--text-muted)" />
                                    </motion.span>
                                    Saving...
                                </span>
                            ) : 'Save changes'}
                        </motion.button>

                        <AnimatePresence>
                            {saveStatus !== 'idle' && saveStatus !== 'saving' && (
                                <motion.span
                                    className='sm:text-[15px] text-[13px] flex flex-row items-center gap-1'
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        fontWeight: 600,
                                        color: saveStatus === 'saved' ? '#22C55E' : '#EF4444',
                                    }}
                                >
                                    {saveStatus === 'saved'
                                        ? <CheckCircle size={14} strokeWidth={2.5} color="#22C55E" />
                                        : <AlertTriangle size={14} strokeWidth={2.5} color="#EF4444" />
                                    }
                                    {saveMessage}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

            </div>

            <style>{`
                @media (max-width: 480px) {
                    .section-label { display: none; }
                }
            `}</style>
        </AppShell>
    )
}