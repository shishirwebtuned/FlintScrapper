'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AppShell } from '@/components/AppShell'
import Link from 'next/link'
import { BarChart2, CalendarDays, Target, ThumbsUp, Zap } from 'lucide-react'

type Stats = {
    totalMatched: number
    totalInterested: number
    totalPassed: number
    totalViewed: number
    leadsThisWeek: number
    conversionRate: number
    avgScore: number
    topTrade: string
    recentLeads: {
        id: string
        lead_id: string
        status: string
        created_at: string
        match_score: number
        leads: {
            raw_title: string
            trade_types: string[]
            suburb: string | null
            state: string | null
            score: number
            urgency: string
        }
    }[]
}

type Profile = {
    contact_name: string
    tier: string
    leads_used_this_month: number
    leads_limit: number
    trade_types: string[]
    base_suburb: string | null
    service_radius_km: number
    subscription_status: string
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

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

// ── Stat card ──
function StatCard({
    icon: Icon, label, value, sub, color = 'var(--ember-500)', delay = 0
}: {
    icon: React.ElementType
    label: string
    value: string | number
    sub?: string
    color?: string
    delay?: number
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px', padding: '20px',
                position: 'relative', overflow: 'hidden',
            }}
        >
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            }} />
            <div style={{ marginBottom: '10px' }}>
                <Icon size={22} strokeWidth={2} color={color} />
            </div>
            <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '32px', fontWeight: 700,
                color, lineHeight: 1, marginBottom: '4px',
                letterSpacing: '-1px',
            }}>{value}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</div>
            {sub && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>{sub}</div>}
        </motion.div>
    )
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }

            // Load profile
            const { data: prof } = await supabase
                .from('profiles')
                .select('contact_name, tier, leads_used_this_month, leads_limit, trade_types, base_suburb, service_radius_km, subscription_status')
                .eq('id', user.id)
                .maybeSingle()

            if (prof) setProfile(prof)

            // Load all lead matches for stats
            const { data: matches } = await supabase
                .from('lead_matches')
                .select(`
                    id, lead_id, status, created_at, match_score,
                    leads ( raw_title, trade_types, suburb, state, score, urgency )
                `)
                .eq('tradie_id', user.id)
                .order('created_at', { ascending: false })

            if (matches) {
                const total = matches.length
                const interested = matches.filter(m => m.status === 'interested').length
                const passed = matches.filter(m => m.status === 'passed').length
                const viewed = matches.filter(m => m.viewed_at !== null || m.status !== 'sent').length

                // Leads this week
                const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
                const thisWeek = matches.filter(m => new Date(m.created_at).getTime() > weekAgo).length

                // Conversion rate
                const conversion = total > 0 ? Math.round((interested / total) * 100) : 0

                // Avg score
                const avgScore = total > 0
                    ? Math.round(matches.reduce((sum, m) => sum + (m.leads?.score || 0), 0) / total)
                    : 0

                // Top trade
                const tradeCounts: Record<string, number> = {}
                matches.forEach(m => {
                    m.leads?.trade_types?.forEach((t: string) => {
                        tradeCounts[t] = (tradeCounts[t] || 0) + 1
                    })
                })
                const topTrade = Object.entries(tradeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || ''

                setStats({
                    totalMatched: total,
                    totalInterested: interested,
                    totalPassed: passed,
                    totalViewed: viewed,
                    leadsThisWeek: thisWeek,
                    conversionRate: conversion,
                    avgScore,
                    topTrade,
                    recentLeads: matches.slice(0, 5) as Stats['recentLeads'],
                })
            }

            setLoading(false)
        }
        load()
    }, [router, supabase])

    if (loading) {
        return (
            <AppShell>
                <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
                        {[1, 2, 3, 4].map((i) => (
                            <motion.div
                                key={i}
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.15 }}
                                style={{
                                    backgroundColor: 'var(--bg-surface)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '16px', height: '110px',
                                }}
                            />
                        ))}
                    </div>
                </div>
            </AppShell>
        )
    }

    return (
        <AppShell>
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>

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
                    }}>Dashboard</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Your lead activity overview
                    </p>
                </motion.div>

                {/* ── Profile summary card ── */}
                {profile && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        style={{
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px', padding: '20px',
                            marginBottom: '20px',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: 'linear-gradient(135deg, #FF6B35, #E85A24)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: 'var(--font-display)', fontWeight: 800,
                                color: 'white', fontSize: '20px',
                                flexShrink: 0,
                            }}>
                                {profile.contact_name?.charAt(0) || 'T'}
                            </div>
                            <div>
                                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
                                    {profile.contact_name}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    {profile.base_suburb || 'Location not set'} · {profile.service_radius_km}km radius
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            {/* Trade tags */}
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {profile.trade_types.slice(0, 3).map(t => (
                                    <span key={t} style={{
                                        fontSize: '11px', fontWeight: 600,
                                        backgroundColor: 'rgba(255,107,53,0.08)',
                                        color: 'var(--ember-500)',
                                        padding: '2px 8px', borderRadius: '100px',
                                        border: '1px solid rgba(255,107,53,0.15)',
                                    }}>{tradeEmoji(t)} {t}</span>
                                ))}
                                {profile.trade_types.length > 3 && (
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '2px 6px' }}>
                                        +{profile.trade_types.length - 3}
                                    </span>
                                )}
                            </div>

                            {/* Tier */}
                            <span style={{
                                fontSize: '11px', fontWeight: 800,
                                backgroundColor: 'rgba(255,107,53,0.1)',
                                color: 'var(--ember-500)',
                                padding: '4px 12px', borderRadius: '100px',
                                border: '1px solid rgba(255,107,53,0.2)',
                                textTransform: 'uppercase', letterSpacing: '0.5px',
                                fontFamily: 'var(--font-mono)',
                            }}>{profile.tier}</span>

                            <Link href="/settings" style={{
                                fontSize: '13px', fontWeight: 600,
                                color: 'var(--text-secondary)', textDecoration: 'none',
                                padding: '6px 12px', borderRadius: '8px',
                                border: '1px solid var(--border)',
                                backgroundColor: 'var(--bg-surface-raised)',
                            }}>Edit profile</Link>
                        </div>
                    </motion.div>
                )}

                {/* ── Stat grid ── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    marginBottom: '20px',
                }}>
                    <StatCard icon={Zap} label="Total leads matched" delay={0.1}
                        value={stats?.totalMatched || 0} sub="All time"
                        color="var(--ember-500)" />

                    <StatCard icon={ThumbsUp} label="Interested" delay={0.15}
                        value={stats?.totalInterested || 0} sub={`${stats?.conversionRate || 0}% conversion rate`}
                        color="#22C55E" />

                    <StatCard icon={CalendarDays} label="This week" delay={0.2}
                        value={stats?.leadsThisWeek || 0} sub="New leads matched"
                        color="#3B82F6" />

                    <StatCard icon={Target} label="Avg lead score" delay={0.25}
                        value={stats?.avgScore || 0} sub="Out of 100"
                        color="#F59E0B" />
                </div>

                {/* ── Monthly usage ── */}
                {profile && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px', padding: '20px',
                            marginBottom: '20px',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Monthly usage
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-muted)' }}>
                                    {profile.leads_used_this_month} / {profile.leads_limit === 9999 ? '∞' : profile.leads_limit}
                                </span>
                                {profile.leads_limit !== 9999 && profile.leads_used_this_month >= profile.leads_limit && (
                                    <span style={{
                                        fontSize: '11px', fontWeight: 700,
                                        backgroundColor: 'rgba(239,68,68,0.1)',
                                        color: '#EF4444', padding: '2px 8px',
                                        borderRadius: '100px',
                                    }}>Limit reached</span>
                                )}
                            </div>
                        </div>

                        <div style={{
                            height: '8px', borderRadius: '4px',
                            backgroundColor: 'var(--bg-surface-raised)',
                            overflow: 'hidden', marginBottom: '12px',
                        }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                    width: profile.leads_limit === 9999
                                        ? '30%'
                                        : `${Math.min(100, (profile.leads_used_this_month / profile.leads_limit) * 100)}%`
                                }}
                                transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                                style={{
                                    height: '100%', borderRadius: '4px',
                                    backgroundColor: profile.leads_used_this_month >= profile.leads_limit
                                        ? '#EF4444' : 'var(--ember-500)',
                                }}
                            />
                        </div>

                        {profile.tier !== 'inferno' && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                    Resets on the 1st of each month
                                </span>
                                <Link href="/settings" style={{
                                    fontSize: '13px', fontWeight: 600,
                                    color: 'var(--ember-500)', textDecoration: 'none',
                                }}>Upgrade →</Link>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── Recent leads ── */}
                {stats && stats.recentLeads.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        style={{
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px', padding: '20px',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Recent leads
                            </h2>
                            <Link href="/feed" style={{ fontSize: '13px', color: 'var(--ember-500)', textDecoration: 'none', fontWeight: 600 }}>
                                View all →
                            </Link>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {stats.recentLeads.map((match, i) => {
                                const statusColor = match.status === 'interested' ? '#22C55E' : match.status === 'passed' ? '#6B7280' : 'var(--ember-500)'
                                const statusLabel = match.status === 'interested' ? '✓ Interested' : match.status === 'passed' ? 'Passed' : 'New'

                                return (
                                    <motion.div
                                        key={match.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + i * 0.05 }}
                                    >
                                        <Link href={`/lead/${match.lead_id}`} style={{ textDecoration: 'none' }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center',
                                                gap: '12px', padding: '12px',
                                                borderRadius: '10px',
                                                transition: 'background-color 0.15s',
                                                cursor: 'pointer',
                                            }}
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-raised)')}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                            >
                                                {/* Trade emoji */}
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '9px',
                                                    backgroundColor: 'var(--bg-surface-raised)',
                                                    border: '1px solid var(--border)',
                                                    display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', fontSize: '18px', flexShrink: 0,
                                                }}>
                                                    {tradeEmoji(match.leads?.trade_types?.[0] || '')}
                                                </div>

                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        fontSize: '13px', fontWeight: 600,
                                                        color: 'var(--text-primary)',
                                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                    }}>
                                                        {match.leads?.raw_title}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                        {match.leads?.suburb}{match.leads?.state ? `, ${match.leads.state}` : ''} · {timeAgo(match.created_at)}
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                                                    <span style={{
                                                        fontFamily: 'var(--font-mono)',
                                                        fontSize: '12px', fontWeight: 700,
                                                        color: 'var(--text-muted)',
                                                    }}>{match.match_score}</span>
                                                    <span style={{
                                                        fontSize: '11px', fontWeight: 700,
                                                        color: statusColor,
                                                        backgroundColor: `${statusColor}15`,
                                                        padding: '2px 8px', borderRadius: '100px',
                                                    }}>{statusLabel}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}

                {/* ── Empty state ── */}
                {stats && stats.totalMatched === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{
                            textAlign: 'center', padding: '60px 24px',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                        }}
                    >
                        <div style={{ marginBottom: '16px' }}>
                            <BarChart2 size={48} strokeWidth={1.5} color="var(--text-muted)" />
                        </div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>
                            No data yet
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '300px', margin: '0 auto 20px' }}>
                            Stats will appear here once you start receiving and acting on leads.
                        </p>
                        <Link href="/feed" style={{
                            display: 'inline-block',
                            background: 'linear-gradient(135deg, #FF6B35, #E85A24)',
                            color: 'white', padding: '10px 24px', borderRadius: '10px',
                            fontSize: '14px', fontWeight: 700, textDecoration: 'none',
                            fontFamily: 'var(--font-display)',
                        }}>Go to feed →</Link>
                    </motion.div>
                )}

            </div>
        </AppShell>
    )
}