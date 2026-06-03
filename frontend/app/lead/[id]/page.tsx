'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell } from '@/components/AppShell'

// ── Types ──
type LeadDetail = {
    id: string
    lead_id: string
    match_score: number
    distance_km: number
    status: string
    created_at: string
    viewed_at: string | null
    interested_at: string | null
    ai_response_draft: string | null
    pricing_hint: string | null
    leads: {
        id: string
        raw_title: string
        raw_text: string | null
        ai_summary: string | null
        ai_description: string | null
        trade_types: string[]
        urgency: string
        job_scope: string | null
        budget_min: number | null
        budget_max: number | null
        budget_text: string | null
        contact_name: string | null
        contact_phone: string | null
        contact_email: string | null
        suburb: string | null
        state: string | null
        postcode: string | null
        score: number
        score_breakdown: Record<string, number> | null
        expires_at: string
        source_url: string | null
        source: string
        created_at: string
    }
}

// ── Helpers ──
function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

function urgencyConfig(urgency: string) {
    switch (urgency) {
        case 'emergency': return { label: 'Emergency', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' }
        case 'this_week': return { label: 'This week', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' }
        case 'this_month': return { label: 'This month', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' }
        case 'planning': return { label: 'Planning', color: '#22C55E', bg: 'rgba(34,197,94,0.1)' }
        default: return { label: 'Unknown', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' }
    }
}

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

// ── Score ring ──
function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
    const color = score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444'
    const r = size / 2 - 6
    const circ = 2 * Math.PI * r
    const offset = circ - (score / 100) * circ

    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            </svg>
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
            }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: size * 0.22, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
                <span style={{ fontSize: size * 0.13, color: 'var(--text-muted)', lineHeight: 1, marginTop: '2px' }}>score</span>
            </div>
        </div>
    )
}

// ── Info row ──
function InfoRow({ icon, label, value, mono = false }: { icon: string; label: string; value: string; mono?: boolean }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 0',
            borderBottom: '1px solid var(--border)',
        }}>
            <span style={{ fontSize: '18px', width: '24px', textAlign: 'center', flexShrink: 0 }}>{icon}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', width: '100px', flexShrink: 0 }}>{label}</span>
            <span style={{
                fontSize: '14px', fontWeight: 600,
                color: 'var(--text-primary)',
                fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
            }}>{value}</span>
        </div>
    )
}

export default function LeadDetailPage() {
    const [match, setMatch] = useState<LeadDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [copied, setCopied] = useState(false)
    const [notFound, setNotFound] = useState(false)

    const router = useRouter()
    const params = useParams()
    const leadId = params.id as string
    const supabase = createClient()

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }

            const { data, error } = await supabase
                .from('lead_matches')
                .select(`
                    id, lead_id, match_score, distance_km, status,
                    created_at, viewed_at, interested_at,
                    ai_response_draft, pricing_hint,
                    leads (
                        id, raw_title, raw_text, ai_summary, ai_description,
                        trade_types, urgency, job_scope,
                        budget_min, budget_max, budget_text,
                        contact_name, contact_phone, contact_email,
                        suburb, state, postcode, score, score_breakdown,
                        expires_at, source_url, source, created_at
                    )
                `)
                .eq('lead_id', leadId)
                .eq('tradie_id', user.id)
                .maybeSingle()

            if (error || !data) {
                setNotFound(true)
                setLoading(false)
                return
            }

            setMatch(data as LeadDetail)

            // Mark as viewed
            if (!data.viewed_at) {
                await supabase
                    .from('lead_matches')
                    .update({ viewed_at: new Date().toISOString(), status: 'viewed' })
                    .eq('id', data.id)
                    .eq('status', 'sent')
            }

            setLoading(false)
        }
        load()
    }, [leadId, router, supabase])

    async function handleAction(action: 'interested' | 'passed') {
        if (!match) return
        setActionLoading(true)

        await supabase
            .from('lead_matches')
            .update({
                status: action === 'interested' ? 'interested' : 'passed',
                ...(action === 'interested' ? { interested_at: new Date().toISOString() } : {}),
            })
            .eq('id', match.id)

        setMatch((prev) => prev ? { ...prev, status: action === 'interested' ? 'interested' : 'passed' } : prev)
        setActionLoading(false)
    }

    async function copyDraft() {
        if (!match?.ai_response_draft) return
        await navigator.clipboard.writeText(match.ai_response_draft)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // ── Loading ──
    if (loading) {
        return (
            <AppShell>
                <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>
                    {[1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                            style={{
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '16px', height: i === 1 ? '120px' : '80px',
                                marginBottom: '12px',
                            }}
                        />
                    ))}
                </div>
            </AppShell>
        )
    }

    // ── Not found ──
    if (notFound || !match) {
        return (
            <AppShell>
                <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
                        Lead not found
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                        This lead may have expired or wasn't matched to you.
                    </p>
                    <Link href="/feed" style={{
                        display: 'inline-block', padding: '11px 24px',
                        background: 'linear-gradient(135deg, #FF6B35, #E85A24)',
                        color: 'white', borderRadius: '10px',
                        textDecoration: 'none', fontSize: '14px', fontWeight: 700,
                        fontFamily: 'var(--font-display)',
                    }}>← Back to feed</Link>
                </div>
            </AppShell>
        )
    }

    const lead = match.leads
    const urgency = urgencyConfig(lead.urgency)
    const isInterested = match.status === 'interested'
    const isPassed = match.status === 'passed'
    const expiresIn = Math.max(0, Math.floor((new Date(lead.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    const isExpired = new Date(lead.expires_at) < new Date()

    return (
        <AppShell>
            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>

                {/* ── Back link ── */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ marginBottom: '24px' }}
                >
                    <Link href="/feed" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        fontSize: '13px', color: 'var(--text-muted)',
                        textDecoration: 'none', fontWeight: 500,
                    }}>
                        ← Back to feed
                    </Link>
                </motion.div>

                {/* ── Hero card ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                    style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: `1px solid ${isInterested ? 'rgba(34,197,94,0.35)' : 'var(--border)'}`,
                        borderRadius: '20px', padding: '28px',
                        marginBottom: '16px', position: 'relative', overflow: 'hidden',
                        boxShadow: isInterested
                            ? '0 8px 32px rgba(34,197,94,0.08)'
                            : '0 4px 24px rgba(0,0,0,0.05)',
                    }}
                >
                    {/* Top accent line */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                        background: isInterested
                            ? 'linear-gradient(90deg, transparent, #22C55E, transparent)'
                            : 'linear-gradient(90deg, transparent, var(--ember-500), transparent)',
                    }} />

                    {/* Header */}
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <ScoreRing score={lead.score} size={72} />

                        <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Badges */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                {lead.trade_types.map((t) => (
                                    <span key={t} style={{
                                        fontSize: '12px', fontWeight: 600,
                                        backgroundColor: 'rgba(255,107,53,0.08)',
                                        color: 'var(--ember-500)',
                                        padding: '3px 10px', borderRadius: '100px',
                                        border: '1px solid rgba(255,107,53,0.15)',
                                    }}>{tradeEmoji(t)} {t.charAt(0).toUpperCase() + t.slice(1)}</span>
                                ))}
                                <span style={{
                                    fontSize: '12px', fontWeight: 600,
                                    backgroundColor: urgency.bg, color: urgency.color,
                                    padding: '3px 10px', borderRadius: '100px',
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                }}>
                                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: urgency.color, display: 'inline-block' }} />
                                    {urgency.label}
                                </span>
                                {isInterested && (
                                    <span style={{
                                        fontSize: '11px', fontWeight: 800,
                                        backgroundColor: 'rgba(34,197,94,0.1)',
                                        color: '#22C55E', padding: '3px 10px', borderRadius: '100px',
                                    }}>✓ Interested</span>
                                )}
                                {isPassed && (
                                    <span style={{
                                        fontSize: '11px', fontWeight: 800,
                                        backgroundColor: 'rgba(107,114,128,0.1)',
                                        color: '#6B7280', padding: '3px 10px', borderRadius: '100px',
                                    }}>Passed</span>
                                )}
                            </div>

                            <h1 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 'clamp(18px, 3vw, 24px)',
                                fontWeight: 800, letterSpacing: '-0.5px',
                                color: 'var(--text-primary)', lineHeight: 1.2,
                                marginBottom: '8px',
                            }}>{lead.raw_title}</h1>

                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                    🕐 {timeAgo(lead.created_at)}
                                </span>
                                {match.distance_km && (
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                        🗺 {match.distance_km}km away
                                    </span>
                                )}
                                {!isExpired && expiresIn <= 3 && (
                                    <span style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 600 }}>
                                        ⏳ Expires in {expiresIn === 0 ? 'today' : `${expiresIn}d`}
                                    </span>
                                )}
                                {isExpired && (
                                    <span style={{ fontSize: '12px', color: '#EF4444', fontWeight: 600 }}>
                                        ⚠️ Expired
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* AI Summary */}
                    {lead.ai_summary && (
                        <div style={{
                            backgroundColor: 'var(--bg-surface-raised)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px', padding: '16px',
                            marginBottom: '20px',
                        }}>
                            <div style={{
                                fontSize: '11px', fontWeight: 700,
                                color: 'var(--ember-500)', letterSpacing: '1.5px',
                                textTransform: 'uppercase', marginBottom: '8px',
                                fontFamily: 'var(--font-mono)',
                            }}>AI Summary</div>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                                {lead.ai_summary}
                            </p>
                        </div>
                    )}

                    {/* Action buttons */}
                    {!isPassed && !isExpired && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {!isInterested ? (
                                <>
                                    <motion.button
                                        onClick={() => handleAction('interested')}
                                        disabled={actionLoading}
                                        whileHover={{ scale: 1.03, y: -1 }}
                                        whileTap={{ scale: 0.97 }}
                                        style={{
                                            flex: 1, padding: '13px',
                                            borderRadius: '12px', border: 'none',
                                            background: 'linear-gradient(135deg, #FF6B35, #E85A24)',
                                            color: 'white', fontSize: '15px', fontWeight: 700,
                                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                                            fontFamily: 'var(--font-display)',
                                            boxShadow: '0 6px 20px rgba(255,107,53,0.35)',
                                            opacity: actionLoading ? 0.7 : 1,
                                        }}
                                    >
                                        {actionLoading ? '...' : '👍 I\'m interested'}
                                    </motion.button>
                                    <motion.button
                                        onClick={() => handleAction('passed')}
                                        disabled={actionLoading}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        style={{
                                            padding: '13px 24px',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border)',
                                            backgroundColor: 'var(--bg-surface-raised)',
                                            color: 'var(--text-secondary)',
                                            fontSize: '14px', fontWeight: 600,
                                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                                            fontFamily: 'var(--font-heading)',
                                        }}
                                    >Pass</motion.button>
                                </>
                            ) : (
                                <div style={{
                                    flex: 1, padding: '13px',
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(34,197,94,0.08)',
                                    border: '1px solid rgba(34,197,94,0.2)',
                                    textAlign: 'center',
                                    fontSize: '14px', fontWeight: 700, color: '#22C55E',
                                }}>
                                    ✓ You marked this as interested
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* ── Job details card ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '20px', padding: '24px',
                        marginBottom: '16px',
                    }}
                >
                    <h2 style={{
                        fontFamily: 'var(--font-heading)', fontSize: '15px',
                        fontWeight: 700, color: 'var(--text-primary)',
                        marginBottom: '4px',
                    }}>Job details</h2>

                    <div style={{ marginTop: '4px' }}>
                        {lead.suburb && (
                            <InfoRow icon="📍" label="Location" value={`${lead.suburb}${lead.state ? `, ${lead.state}` : ''}${lead.postcode ? ` ${lead.postcode}` : ''}`} />
                        )}
                        {match.distance_km && (
                            <InfoRow icon="🗺" label="Distance" value={`${match.distance_km}km from you`} mono />
                        )}
                        <InfoRow icon="⚡" label="Urgency" value={urgency.label} />
                        {lead.job_scope && (
                            <InfoRow icon="📋" label="Job size" value={lead.job_scope.replace(/_/g, ' ')} />
                        )}
                        {(lead.budget_min || lead.budget_max || lead.budget_text) && (
                            <InfoRow
                                icon="💰" label="Budget"
                                value={lead.budget_text || (
                                    lead.budget_min && lead.budget_max
                                        ? `$${lead.budget_min} – $${lead.budget_max}`
                                        : lead.budget_min ? `From $${lead.budget_min}` : `Up to $${lead.budget_max}`
                                ) || ''}
                                mono
                            />
                        )}
                        <InfoRow icon="🏆" label="Match score" value={`${match.match_score} / 100`} mono />
                        <InfoRow icon="📅" label="Posted" value={timeAgo(lead.created_at)} />
                        <div style={{ paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '18px', width: '24px', textAlign: 'center', flexShrink: 0 }}>🔗</span>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)', width: '100px', flexShrink: 0 }}>Apply</span>
                            {lead.source_url ? (
                                <a href={lead.source_url} target="_blank" rel="noopener noreferrer" style={{
                                    fontSize: '14px', fontWeight: 600,
                                    color: 'var(--ember-500)', textDecoration: 'none',
                                }}>
                                    Apply here ↗
                                </a>
                            ) : (
                                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{lead.source}</span>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* ── Raw listing ── */}
                {lead.raw_text && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.5 }}
                        style={{
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '20px', padding: '24px',
                            marginBottom: '16px',
                        }}
                    >
                        <h2 style={{
                            fontFamily: 'var(--font-heading)', fontSize: '15px',
                            fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px',
                        }}>Original listing</h2>
                        <p style={{
                            fontSize: '14px', color: 'var(--text-secondary)',
                            lineHeight: 1.7, whiteSpace: 'pre-wrap',
                            fontFamily: 'var(--font-sans)',
                        }}>
                            {lead.raw_text.slice(0, 800)}{lead.raw_text.length > 800 ? '...' : ''}
                        </p>
                    </motion.div>
                )}

                {/* ── AI response draft ── */}
                {match.ai_response_draft && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        style={{
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid rgba(255,107,53,0.2)',
                            borderRadius: '20px', padding: '24px',
                            marginBottom: '16px',
                            background: 'linear-gradient(135deg, rgba(255,107,53,0.03) 0%, var(--bg-surface) 100%)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h2 style={{
                                fontFamily: 'var(--font-heading)', fontSize: '15px',
                                fontWeight: 700, color: 'var(--text-primary)',
                            }}>💬 Suggested opening message</h2>
                            <motion.button
                                onClick={copyDraft}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    padding: '6px 14px', borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--bg-surface-raised)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '12px', fontWeight: 600,
                                    cursor: 'pointer', fontFamily: 'var(--font-heading)',
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={copied ? 'copied' : 'copy'}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        {copied ? '✓ Copied!' : '📋 Copy'}
                                    </motion.span>
                                </AnimatePresence>
                            </motion.button>
                        </div>
                        <p style={{
                            fontSize: '14px', color: 'var(--text-secondary)',
                            lineHeight: 1.7, fontStyle: 'italic',
                            backgroundColor: 'var(--bg-surface-raised)',
                            border: '1px solid var(--border)',
                            borderRadius: '10px', padding: '14px',
                        }}>
                            "{match.ai_response_draft}"
                        </p>
                    </motion.div>
                )}

                {/* ── Pricing hint ── */}
                {match.pricing_hint && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, duration: 0.5 }}
                        style={{
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid rgba(34,197,94,0.2)',
                            borderRadius: '20px', padding: '24px',
                            marginBottom: '16px',
                        }}
                    >
                        <h2 style={{
                            fontFamily: 'var(--font-heading)', fontSize: '15px',
                            fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px',
                        }}>💡 Pricing hint</h2>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            {match.pricing_hint}
                        </p>
                    </motion.div>
                )}

                {/* ── Score breakdown ── */}
                {lead.score_breakdown && Object.keys(lead.score_breakdown).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        style={{
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '20px', padding: '24px',
                            marginBottom: '16px',
                        }}
                    >
                        <h2 style={{
                            fontFamily: 'var(--font-heading)', fontSize: '15px',
                            fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px',
                        }}>Score breakdown</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {Object.entries(lead.score_breakdown).map(([key, value]) => (
                                <div key={key}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                            {key.replace(/_/g, ' ')}
                                        </span>
                                        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                                            {value}/30
                                        </span>
                                    </div>
                                    <div style={{
                                        height: '4px', borderRadius: '2px',
                                        backgroundColor: 'var(--bg-surface-raised)',
                                        overflow: 'hidden',
                                    }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(value / 30) * 100}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                            style={{
                                                height: '100%', borderRadius: '2px',
                                                backgroundColor: 'var(--ember-500)',
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

            </div>
        </AppShell>
    )
}