'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell } from '@/components/AppShell'
import { RefreshCw } from 'lucide-react'

// ── Types ──
type Lead = {
    id: string
    lead_id: string
    match_score: number
    distance_km: number
    status: string
    created_at: string
    viewed_at: string | null
    leads: {
        id: string
        raw_title: string
        ai_summary: string
        trade_types: string[]
        urgency: string
        job_scope: string | null
        budget_min: number | null
        budget_max: number | null
        budget_text: string | null
        suburb: string | null
        state: string | null
        postcode: string | null
        score: number
        expires_at: string
        source_url: string | null
    }[]
}

type Profile = {
    contact_name: string
    trade_types: string[]
    tier: string
    leads_used_this_month: number
    leads_limit: number
    subscription_status: string
}

// ── Helper: time ago ──
function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

// ── Helper: urgency config ──
function urgencyConfig(urgency: string) {
    switch (urgency) {
        case 'emergency': return { label: 'Emergency', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', dot: '#EF4444' }
        case 'this_week': return { label: 'This week', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', dot: '#F59E0B' }
        case 'this_month': return { label: 'This month', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', dot: '#3B82F6' }
        case 'planning': return { label: 'Planning', color: '#22C55E', bg: 'rgba(34,197,94,0.1)', dot: '#22C55E' }
        default: return { label: 'Unknown', color: '#6B7280', bg: 'rgba(107,114,128,0.1)', dot: '#6B7280' }
    }
}

// ── Helper: trade emoji ──
function tradeEmoji(trade: string): string {
    const map: Record<string, string> = {
        plumber: '🔧', gasfitter: '🔥', electrician: '⚡', painter: '🎨',
        cleaner: '🧹', landscaper: '🌿', handyman: '🪛', tiler: '🪟',
        builder: '🏗️', carpenter: '🪚', roofer: '🏠', concreter: '🧱',
        plasterer: '🪣', fencer: '🪵', glazier: '🪞', locksmith: '🔑',
        pest_control: '🐛', hvac: '❄️', demolition: '🪓', inspector: '📋',
    }
    return map[trade] || '🔨'
}

// ── Score ring component ──
function ScoreRing({ score }: { score: number }) {
    const color = score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444'
    const r = 18
    const circ = 2 * Math.PI * r
    const offset = circ - (score / 100) * circ

    return (
        <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
            <svg width="48" height="48" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="24" cy="24" r={r} fill="none" stroke="var(--border)" strokeWidth="3" />
                <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="3"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
            </svg>
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color,
            }}>{score}</div>
        </div>
    )
}

// ── Lead card component ──
function LeadCard({
    match, onAction, actionLoading,
}: {
    match: Lead
    onAction: (matchId: string, action: 'interested' | 'passed') => void
    actionLoading: string | null
}) {
    const lead = match.leads?.[0]
    if (!lead) return null
    const urgency = urgencyConfig(lead.urgency)
    const isNew = !match.viewed_at
    const isPassed = match.status === 'passed'
    const isInterested = match.status === 'interested'
    const isLoading = actionLoading === match.id

    // Time left until expiry
    const expiresIn = Math.max(0, Math.floor((new Date(lead.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isPassed ? 0.45 : 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, height: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            style={{
                backgroundColor: 'var(--bg-surface)',
                border: `1px solid ${isInterested ? 'rgba(34,197,94,0.4)' : 'var(--border)'}`,
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: isInterested
                    ? '0 4px 20px rgba(34,197,94,0.08)'
                    : '0 2px 12px rgba(0,0,0,0.04)',
            }}
        >
            {/* Top accent */}
            {isInterested && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: 'linear-gradient(90deg, transparent, #22C55E, transparent)',
                }} />
            )}
            {isNew && !isPassed && !isInterested && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: 'linear-gradient(90deg, transparent, var(--ember-500), transparent)',
                }} />
            )}

            <div style={{ padding: '20px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                    <ScoreRing score={lead.score} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            {/* Trade badges */}
                            {lead.trade_types.slice(0, 2).map((t) => (
                                <span key={t} style={{
                                    fontSize: '11px', fontWeight: 600,
                                    backgroundColor: 'rgba(255,107,53,0.08)',
                                    color: 'var(--ember-500)',
                                    padding: '2px 8px', borderRadius: '100px',
                                    border: '1px solid rgba(255,107,53,0.15)',
                                }}>{tradeEmoji(t)} {t.charAt(0).toUpperCase() + t.slice(1)}</span>
                            ))}

                            {/* Urgency badge */}
                            <span style={{
                                fontSize: '11px', fontWeight: 600,
                                backgroundColor: urgency.bg,
                                color: urgency.color,
                                padding: '2px 8px', borderRadius: '100px',
                                display: 'flex', alignItems: 'center', gap: '4px',
                            }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: urgency.dot, display: 'inline-block' }} />
                                {urgency.label}
                            </span>

                            {/* New badge */}
                            {isNew && !isPassed && (
                                <motion.span
                                    animate={{ opacity: [1, 0.5, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    style={{
                                        fontSize: '10px', fontWeight: 800,
                                        backgroundColor: 'rgba(255,107,53,0.15)',
                                        color: 'var(--ember-500)',
                                        padding: '2px 8px', borderRadius: '100px',
                                        letterSpacing: '0.5px',
                                    }}
                                >NEW</motion.span>
                            )}

                            {isInterested && (
                                <span style={{
                                    fontSize: '10px', fontWeight: 800,
                                    backgroundColor: 'rgba(34,197,94,0.1)',
                                    color: '#22C55E', padding: '2px 8px',
                                    borderRadius: '100px', letterSpacing: '0.5px',
                                }}>✓ INTERESTED</span>
                            )}
                        </div>

                        {/* Title */}
                        <Link href={`/lead/${match.lead_id}`} style={{ textDecoration: 'none' }}>
                            <h3 style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: '15px', fontWeight: 700,
                                color: 'var(--text-primary)', lineHeight: 1.35,
                                cursor: 'pointer',
                                transition: 'color 0.15s',
                            }}
                                onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--ember-500)'}
                                onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--text-primary)'}
                            >
                                {lead.raw_title}
                            </h3>
                        </Link>
                    </div>

                    {/* Time */}
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>
                        {timeAgo(match.created_at)}
                    </div>
                </div>

                {/* Summary */}
                {lead.ai_summary && (
                    <p style={{
                        fontSize: '13px', color: 'var(--text-secondary)',
                        lineHeight: 1.6, marginBottom: '14px',
                        paddingLeft: '60px',
                    }}>
                        {lead.ai_summary}
                    </p>
                )}

                {/* Meta row */}
                <div style={{
                    display: 'flex', gap: '16px', flexWrap: 'wrap',
                    marginBottom: '16px', paddingLeft: '60px',
                }}>
                    {lead.suburb && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            📍 {lead.suburb}{lead.state ? `, ${lead.state}` : ''}
                        </span>
                    )}
                    {match.distance_km && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                            🗺 {match.distance_km}km away
                        </span>
                    )}
                    {(lead.budget_min || lead.budget_max || lead.budget_text) && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            💰 {lead.budget_text || (lead.budget_min && lead.budget_max
                                ? `$${lead.budget_min}–$${lead.budget_max}`
                                : lead.budget_min ? `From $${lead.budget_min}` : `Up to $${lead.budget_max}`)}
                        </span>
                    )}
                    {lead.job_scope && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            📋 {lead.job_scope.replace('_', ' ')}
                        </span>
                    )}
                    {expiresIn <= 2 && (
                        <span style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 600 }}>
                            ⏳ Expires in {expiresIn === 0 ? 'today' : `${expiresIn}d`}
                        </span>
                    )}
                </div>

                {/* Actions */}
                {!isPassed && !isInterested && (
                    <div style={{ display: 'flex', gap: '8px', paddingLeft: '60px' }}>
                        <motion.button
                            onClick={() => onAction(match.id, 'interested')}
                            disabled={!!isLoading}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                flex: 1, padding: '9px 16px',
                                borderRadius: '9px', border: 'none',
                                background: 'linear-gradient(135deg, #FF6B35, #E85A24)',
                                color: 'white', fontSize: '13px', fontWeight: 700,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                fontFamily: 'var(--font-heading)',
                                boxShadow: '0 4px 12px rgba(255,107,53,0.3)',
                                opacity: isLoading ? 0.7 : 1,
                            }}
                        >
                            {isLoading ? '...' : '👍 Interested'}
                        </motion.button>
                        <motion.button
                            onClick={() => onAction(match.id, 'passed')}
                            disabled={!!isLoading}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                padding: '9px 20px',
                                borderRadius: '9px',
                                border: '1px solid var(--border)',
                                backgroundColor: 'var(--bg-surface-raised)',
                                color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                fontFamily: 'var(--font-heading)',
                            }}
                        >
                            Pass
                        </motion.button>
                        <Link href={`/lead/${match.lead_id}`}
                            style={{
                                padding: '9px 16px', borderRadius: '9px',
                                border: '1px solid var(--border)',
                                backgroundColor: 'var(--bg-surface-raised)',
                                color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600,
                                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px',
                            }}
                        >
                            View →
                        </Link>
                    </div>
                )}

                {isInterested && (
                    <div style={{
                        paddingLeft: '60px', display: 'flex',
                        alignItems: 'center', gap: '12px',
                    }}>
                        <Link href={`/lead/${match.lead_id}`} style={{
                            fontSize: '13px', fontWeight: 600, color: '#22C55E',
                            textDecoration: 'none',
                        }}>View full lead →</Link>
                        {lead.source_url && (
                            <a href={lead.source_url} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>
                                View original post ↗
                            </a>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    )
}

// ── Empty state ──
function EmptyState({ filter }: { filter: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                textAlign: 'center', padding: '80px 24px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
            }}
        >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                {filter === 'all' ? '🔍' : filter === 'interested' ? '👍' : '📭'}
            </div>
            <h3 style={{
                fontFamily: 'var(--font-heading)', fontSize: '18px',
                fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px',
            }}>
                {filter === 'all' ? 'No leads yet' : filter === 'interested' ? 'No interested leads' : 'No passed leads'}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '320px', margin: '0 auto' }}>
                {filter === 'all'
                    ? 'The scraper runs every 15 minutes. New leads matching your trade and location will appear here automatically.'
                    : 'Leads you mark as interested will appear here.'}
            </p>
        </motion.div>
    )
}

// ── Main feed page ──
export default function FeedPage() {
    const [matches, setMatches] = useState<Lead[]>([])
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'interested' | 'passed'>('all')
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [lastRefresh, setLastRefresh] = useState(new Date())

    const router = useRouter()
    const supabase = createClient()

    const loadData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        // Load profile
        // Load profile
        const { data: prof, error: profError } = await supabase
            .from('profiles')
            .select('contact_name, trade_types, tier, leads_used_this_month, leads_limit, subscription_status, onboarding_complete')
            .eq('id', user.id)
            .maybeSingle()

        // No profile row at all → go to onboarding
        if (profError) {
            console.error('Profile error:', profError)
            router.push('/onboarding')
            return
        }

        // Profile exists but onboarding not done → go to onboarding
        if (!prof || !prof.trade_types?.length || !prof.onboarding_complete) {
            router.push('/onboarding')
            return
        }

        setProfile(prof)

        // Load lead matches with lead data
        const { data: leadMatches } = await supabase
            .from('lead_matches')
            .select(`
                id, lead_id, match_score, distance_km, status, created_at, viewed_at,
                leads (
                    id, raw_title, ai_summary, trade_types, urgency, job_scope,
                    budget_min, budget_max, budget_text, suburb, state, postcode,
                    score, expires_at, source_url
                )
            `)
            .eq('tradie_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)

        if (leadMatches) {
            // Mark unseen leads as viewed
            const unseenIds = leadMatches
                .filter((m) => !m.viewed_at)
                .map((m) => m.id)

            if (unseenIds.length > 0) {
                await supabase
                    .from('lead_matches')
                    .update({ viewed_at: new Date().toISOString(), status: 'viewed' })
                    .in('id', unseenIds)
                    .eq('status', 'sent')
            }

            setMatches(leadMatches as Lead[])
        }

        setLoading(false)
        setLastRefresh(new Date())
    }, [router, supabase])

    useEffect(() => {
        loadData()
        // Auto-refresh every 5 minutes
        const interval = setInterval(loadData, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [loadData])

    async function handleAction(matchId: string, action: 'interested' | 'passed') {
        setActionLoading(matchId)

        await supabase
            .from('lead_matches')
            .update({
                status: action === 'interested' ? 'interested' : 'passed',
                ...(action === 'interested' ? { interested_at: new Date().toISOString() } : {}),
            })
            .eq('id', matchId)

        setMatches((prev) =>
            prev.map((m) =>
                m.id === matchId ? { ...m, status: action === 'interested' ? 'interested' : 'passed' } : m
            )
        )

        setActionLoading(null)
    }

    // Filter leads
    const filteredMatches = matches.filter((m) => {
        if (filter === 'all') return m.status !== 'passed'
        if (filter === 'interested') return m.status === 'interested'
        if (filter === 'passed') return m.status === 'passed'
        return true
    })

    const newCount = matches.filter((m) => !m.viewed_at && m.status === 'sent').length
    const interestedCount = matches.filter((m) => m.status === 'interested').length

    // ── Loading skeleton ──
    if (loading) {
        return (
            <AppShell >

                <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>
                    {[1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                            style={{
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '16px', padding: '20px',
                                marginBottom: '12px', height: '140px',
                            }}
                        />
                    ))}
                </div>
            </AppShell>
        )
    }

    return (
        <AppShell>

            <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>

                {/* ── Page header ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '24px' }}
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div>
                            <h1 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '26px', fontWeight: 900,
                                letterSpacing: '-1px', marginBottom: '4px',
                                color: 'var(--text-primary)',
                            }}>
                                {profile?.contact_name
                                    ? `Good day, ${profile.contact_name.split(' ')[0]} 👋`
                                    : 'Your leads'}
                            </h1>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                Updated {timeAgo(lastRefresh.toISOString())}
                            </p>
                        </div>

                        {/* Refresh button */}
                        <motion.button
                            onClick={loadData}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95, rotate: 180 }}
                            style={{
                                width: '38px', height: '38px',
                                borderRadius: '10px',
                                border: '1px solid var(--border)',
                                backgroundColor: 'var(--bg-surface)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <RefreshCw size={16} strokeWidth={2} color="var(--text-secondary)" />
                        </motion.button>
                    </div>

                    {/* Usage bar */}
                    {profile && (
                        <div style={{
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px', padding: '14px 16px',
                            display: 'flex', alignItems: 'center', gap: '16px',
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                        Leads this month
                                    </span>
                                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                                        {profile.leads_used_this_month} / {profile.leads_limit === 9999 ? '∞' : profile.leads_limit}
                                    </span>
                                </div>
                                <div style={{
                                    height: '5px', borderRadius: '3px',
                                    backgroundColor: 'var(--bg-surface-raised)',
                                    overflow: 'hidden',
                                }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: profile.leads_limit === 9999
                                                ? '30%'
                                                : `${Math.min(100, (profile.leads_used_this_month / profile.leads_limit) * 100)}%`
                                        }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                        style={{
                                            height: '100%', borderRadius: '3px',
                                            backgroundColor: profile.leads_used_this_month >= profile.leads_limit
                                                ? '#EF4444' : 'var(--ember-500)',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Tier badge */}
                            <div style={{
                                fontSize: '11px', fontWeight: 700,
                                padding: '4px 10px', borderRadius: '100px',
                                backgroundColor: 'rgba(255,107,53,0.1)',
                                color: 'var(--ember-500)',
                                border: '1px solid rgba(255,107,53,0.2)',
                                textTransform: 'uppercase', letterSpacing: '0.5px',
                                fontFamily: 'var(--font-mono)',
                            }}>
                                {profile.tier}
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* ── Filter tabs ── */}
                <div style={{
                    display: 'flex', gap: '4px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px', padding: '4px',
                    marginBottom: '20px',
                }}>
                    {([
                        { key: 'all', label: 'All leads', count: matches.filter(m => m.status !== 'passed').length },
                        { key: 'interested', label: 'Interested', count: interestedCount },
                        { key: 'passed', label: 'Passed', count: matches.filter(m => m.status === 'passed').length },
                    ] as const).map((tab) => (
                        <motion.button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                flex: 1, padding: '9px 12px',
                                borderRadius: '9px', border: 'none',
                                cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                                transition: 'all 0.2s',
                                backgroundColor: filter === tab.key ? 'var(--bg-base)' : 'transparent',
                                color: filter === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
                                boxShadow: filter === tab.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                                fontFamily: 'var(--font-sans)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            }}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span style={{
                                    fontSize: '11px', fontWeight: 700,
                                    backgroundColor: filter === tab.key
                                        ? tab.key === 'interested' ? 'rgba(34,197,94,0.15)' : 'rgba(255,107,53,0.12)'
                                        : 'var(--bg-surface-raised)',
                                    color: filter === tab.key
                                        ? tab.key === 'interested' ? '#22C55E' : 'var(--ember-500)'
                                        : 'var(--text-muted)',
                                    padding: '1px 7px', borderRadius: '100px',
                                    fontFamily: 'var(--font-mono)',
                                }}>{tab.count}</span>
                            )}
                        </motion.button>
                    ))}
                </div>

                {/* ── New leads banner ── */}
                <AnimatePresence>
                    {newCount > 0 && filter === 'all' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: '16px' }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            style={{
                                padding: '12px 16px',
                                backgroundColor: 'rgba(255,107,53,0.08)',
                                border: '1px solid rgba(255,107,53,0.2)',
                                borderRadius: '12px',
                                display: 'flex', alignItems: 'center', gap: '10px',
                            }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--ember-500)', flexShrink: 0 }}
                            />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ember-500)' }}>
                                {newCount} new lead{newCount > 1 ? 's' : ''} waiting for you
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Lead list ── */}
                <motion.div layout style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <AnimatePresence mode="popLayout">
                        {filteredMatches.length === 0 ? (
                            <EmptyState filter={filter} />
                        ) : (
                            filteredMatches.map((match) => (
                                <LeadCard
                                    key={match.id}
                                    match={match}
                                    onAction={handleAction}
                                    actionLoading={actionLoading}
                                />
                            ))
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* ── Upgrade nudge (if at limit) ── */}
                {profile && profile.leads_used_this_month >= profile.leads_limit && profile.leads_limit !== 9999 && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            marginTop: '24px', padding: '24px',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid rgba(255,107,53,0.3)',
                            borderRadius: '16px', textAlign: 'center',
                            background: 'linear-gradient(135deg, rgba(255,107,53,0.05) 0%, var(--bg-surface) 100%)',
                        }}
                    >
                        <div style={{ fontSize: '28px', marginBottom: '10px' }}>🔥</div>
                        <h3 style={{
                            fontFamily: 'var(--font-display)', fontSize: '18px',
                            fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.5px',
                        }}>You've hit your monthly limit</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
                            Upgrade to keep getting leads. You won't miss another job.
                        </p>
                        <Link href="/settings" style={{
                            display: 'inline-block',
                            background: 'linear-gradient(135deg, #FF6B35, #E85A24)',
                            color: 'white', padding: '11px 28px',
                            borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                            textDecoration: 'none', fontFamily: 'var(--font-display)',
                            boxShadow: '0 4px 14px rgba(255,107,53,0.35)',
                        }}>Upgrade plan →</Link>
                    </motion.div>
                )}
            </div>
        </AppShell>
    )
}