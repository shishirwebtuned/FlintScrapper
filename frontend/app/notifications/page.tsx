'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell } from '@/components/AppShell'
import Link from 'next/link'

// ── Types ──
type Notification = {
    id: string
    created_at: string
    type: 'new_lead' | 'lead_expiring' | 'subscription' | 'monthly_summary'
    channel: 'push' | 'email' | 'sms'
    title: string | null
    body: string | null
    delivered: boolean
    read_at: string | null
    sent_at: string
    lead_match_id: string | null
    lead_matches: {
        lead_id: string
        leads: {
            raw_title: string
            trade_types: string[]
            suburb: string | null
            state: string | null
        }[] | null
    }[] | null
}

// ── Helpers ──
function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function notifConfig(type: Notification['type']) {
    switch (type) {
        case 'new_lead': return { icon: '⚡', color: '#FF6B35', bg: 'rgba(255,107,53,0.08)', label: 'New lead' }
        case 'lead_expiring': return { icon: '⏳', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', label: 'Expiring soon' }
        case 'subscription': return { icon: '💳', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', label: 'Subscription' }
        case 'monthly_summary': return { icon: '📊', color: '#22C55E', bg: 'rgba(34,197,94,0.08)', label: 'Monthly summary' }
        default: return { icon: '🔔', color: '#6B7280', bg: 'rgba(107,114,128,0.08)', label: 'Notification' }
    }
}

// ── Notification card ──
function NotifCard({
    notif, onRead,
}: {
    notif: Notification
    onRead: (id: string) => void
}) {
    const config = notifConfig(notif.type)
    const isUnread = !notif.read_at
    const lead = notif.lead_matches?.[0]?.leads?.[0]

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            onClick={() => isUnread && onRead(notif.id)}
            style={{
                backgroundColor: isUnread ? config.bg : 'var(--bg-surface)',
                border: `1px solid ${isUnread ? config.color + '25' : 'var(--border)'}`,
                borderRadius: '14px', padding: '16px',
                cursor: notif.lead_match_id ? 'pointer' : isUnread ? 'pointer' : 'default',
                position: 'relative', overflow: 'hidden',
                transition: 'all 0.2s',
            }}
        >
            {/* Unread dot */}
            {isUnread && (
                <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{
                        position: 'absolute', top: '16px', right: '16px',
                        width: '8px', height: '8px', borderRadius: '50%',
                        backgroundColor: config.color,
                    }}
                />
            )}

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                {/* Icon */}
                <div style={{
                    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                    backgroundColor: config.bg,
                    border: `1px solid ${config.color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px',
                }}>{config.icon}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Type label + time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                            fontSize: '11px', fontWeight: 700,
                            color: config.color, letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            fontFamily: 'var(--font-mono)',
                        }}>{config.label}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {timeAgo(notif.sent_at)}
                        </span>
                    </div>

                    {/* Title */}
                    {notif.title && (
                        <div style={{
                            fontSize: '14px', fontWeight: isUnread ? 700 : 600,
                            color: 'var(--text-primary)', marginBottom: '4px',
                            fontFamily: 'var(--font-heading)',
                        }}>{notif.title}</div>
                    )}

                    {/* Body */}
                    {notif.body && (
                        <p style={{
                            fontSize: '13px', color: 'var(--text-secondary)',
                            lineHeight: 1.5, margin: 0,
                        }}>{notif.body}</p>
                    )}

                    {/* Lead preview */}
                    {lead && (
                        <div style={{
                            marginTop: '10px', padding: '10px 12px',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '9px',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between', gap: '8px',
                        }}>
                            <div style={{
                                fontSize: '13px', fontWeight: 600,
                                color: 'var(--text-primary)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                                {lead.raw_title}
                            </div>
                            {notif.lead_matches?.[0]?.lead_id && (
                                <Link
                                    href={`/lead/${notif.lead_matches[0].lead_id}`}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        fontSize: '12px', fontWeight: 700,
                                        color: config.color, textDecoration: 'none',
                                        flexShrink: 0,
                                    }}
                                >View →</Link>
                            )}
                        </div>
                    )}

                    {/* Channel badge */}
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                        <span style={{
                            fontSize: '10px', fontWeight: 600,
                            color: 'var(--text-muted)',
                            backgroundColor: 'var(--bg-surface-raised)',
                            border: '1px solid var(--border)',
                            padding: '2px 7px', borderRadius: '100px',
                            fontFamily: 'var(--font-mono)',
                        }}>
                            {notif.channel === 'push' ? '📱 push' : notif.channel === 'email' ? '📧 email' : '💬 sms'}
                        </span>
                        {notif.delivered && (
                            <span style={{
                                fontSize: '10px', fontWeight: 600,
                                color: '#22C55E',
                                backgroundColor: 'rgba(34,197,94,0.08)',
                                border: '1px solid rgba(34,197,94,0.2)',
                                padding: '2px 7px', borderRadius: '100px',
                                fontFamily: 'var(--font-mono)',
                            }}>✓ delivered</span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// ── Empty state ──
function EmptyState({ filter }: { filter: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                textAlign: 'center', padding: '72px 24px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
            }}
        >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                {filter === 'unread' ? '✅' : '🔔'}
            </div>
            <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: '18px',
                fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)',
            }}>
                {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
            </h3>
            <p style={{
                fontSize: '14px', color: 'var(--text-secondary)',
                lineHeight: 1.6, maxWidth: '280px', margin: '0 auto',
            }}>
                {filter === 'unread'
                    ? 'You\'ve read all your notifications.'
                    : 'Notifications will appear here when new leads are matched to you.'}
            </p>
        </motion.div>
    )
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'unread' | 'leads'>('all')

    const router = useRouter()
    const supabase = createClient()

    const loadNotifications = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data } = await supabase
            .from('notifications')
            .select(`
                id, created_at, type, channel, title, body,
                delivered, read_at, sent_at, lead_match_id,
                lead_matches (
                    lead_id,
                    leads ( raw_title, trade_types, suburb, state )
                )
            `)
            .eq('tradie_id', user.id)
            .order('sent_at', { ascending: false })
            .limit(50)

        if (data) setNotifications(data as Notification[])
        setLoading(false)
    }, [router, supabase])

    useEffect(() => {
        loadNotifications()

        // Real-time subscription for new notifications
        const channel = supabase
            .channel('notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
            }, () => {
                loadNotifications()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [loadNotifications, supabase])

    async function markAsRead(id: string) {
        await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', id)

        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
        )
    }

    async function markAllRead() {
        const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id)
        if (unreadIds.length === 0) return

        await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .in('id', unreadIds)

        setNotifications(prev =>
            prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
        )
    }

    // Filter
    const filtered = notifications.filter(n => {
        if (filter === 'unread') return !n.read_at
        if (filter === 'leads') return n.type === 'new_lead' || n.type === 'lead_expiring'
        return true
    })

    const unreadCount = notifications.filter(n => !n.read_at).length

    // ── Loading ──
    if (loading) {
        return (
            <AppShell>
                <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.15 }}
                            style={{
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '14px', height: '90px',
                                marginBottom: '10px',
                            }}
                        />
                    ))}
                </div>
            </AppShell>
        )
    }

    return (
        <AppShell>
            <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>

                {/* ── Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
                >
                    <div>
                        <h1 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '26px', fontWeight: 900,
                            letterSpacing: '-1px', marginBottom: '4px',
                            color: 'var(--text-primary)',
                        }}>
                            Notifications
                            {unreadCount > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center',
                                        justifyContent: 'center',
                                        marginLeft: '10px',
                                        width: '24px', height: '24px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--ember-500)',
                                        color: 'white', fontSize: '12px',
                                        fontWeight: 800,
                                        fontFamily: 'var(--font-mono)',
                                        verticalAlign: 'middle',
                                    }}
                                >{unreadCount}</motion.span>
                            )}
                        </h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            Lead alerts and account updates
                        </p>
                    </div>

                    {unreadCount > 0 && (
                        <motion.button
                            onClick={markAllRead}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                padding: '8px 16px', borderRadius: '9px',
                                border: '1px solid var(--border)',
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-secondary)',
                                fontSize: '13px', fontWeight: 600,
                                cursor: 'pointer', fontFamily: 'var(--font-heading)',
                                flexShrink: 0,
                            }}
                        >Mark all read</motion.button>
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
                        { key: 'all', label: 'All', count: notifications.length },
                        { key: 'unread', label: 'Unread', count: unreadCount },
                        { key: 'leads', label: 'Leads', count: notifications.filter(n => n.type === 'new_lead' || n.type === 'lead_expiring').length },
                    ] as const).map(tab => (
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
                                    backgroundColor: filter === tab.key && tab.key === 'unread'
                                        ? 'rgba(255,107,53,0.15)'
                                        : 'var(--bg-surface-raised)',
                                    color: filter === tab.key && tab.key === 'unread'
                                        ? 'var(--ember-500)'
                                        : 'var(--text-muted)',
                                    padding: '1px 7px', borderRadius: '100px',
                                    fontFamily: 'var(--font-mono)',
                                }}>{tab.count}</span>
                            )}
                        </motion.button>
                    ))}
                </div>

                {/* ── Notification list ── */}
                <motion.div
                    layout
                    style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                    <AnimatePresence mode="popLayout">
                        {filtered.length === 0 ? (
                            <EmptyState filter={filter} />
                        ) : (
                            filtered.map(notif => (
                                <NotifCard
                                    key={notif.id}
                                    notif={notif}
                                    onRead={markAsRead}
                                />
                            ))
                        )}
                    </AnimatePresence>
                </motion.div>

            </div>
        </AppShell>
    )
}