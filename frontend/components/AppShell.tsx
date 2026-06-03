'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from './ThemeProvider'
import { Zap, LayoutGrid, Settings, LogOut, Bell } from 'lucide-react'

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { href: '/feed', label: 'Leads', icon: Zap },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/settings', label: 'Settings', icon: Settings },

]

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [signingOut, setSigningOut] = useState(false)
    const [showSignOutDialog, setShowSignOutDialog] = useState(false)

    async function handleSignOut() {
        setSigningOut(true)
        setShowSignOutDialog(false)
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--bg-base)',
            display: 'flex',
        }}>

            {/* ── SIDEBAR (desktop) ── */}
            <aside style={{
                width: '220px',
                flexShrink: 0,
                borderRight: '1px solid var(--border)',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                padding: '24px 16px',
                position: 'sticky',
                top: 0,
                height: '100vh',
            }} className="app-sidebar">

                {/* Logo */}
                <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px', padding: '0 8px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'linear-gradient(135deg, #FF6B35, #E85A24)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-display)', fontWeight: 800,
                        color: 'white', fontSize: '16px',
                        boxShadow: '0 3px 10px rgba(255,107,53,0.3)',
                        flexShrink: 0,
                    }}>F</div>
                    <span style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800, fontSize: '17px',
                        color: 'var(--text-primary)', letterSpacing: '-0.5px',
                    }}>Flint</span>
                </Link>

                {/* Nav items */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    {NAV_ITEMS.map((item) => {
                        const active = pathname === item.href || pathname.startsWith(item.href + '/')
                        const Icon = item.icon

                        return (
                            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                                <motion.div
                                    whileHover={{ x: 2 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '10px 12px', borderRadius: '10px',
                                        backgroundColor: active ? 'rgba(255,107,53,0.08)' : 'transparent',
                                        border: `1px solid ${active ? 'rgba(255,107,53,0.15)' : 'transparent'}`,
                                        transition: 'all 0.15s ease',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Icon
                                        size={17}
                                        strokeWidth={2}
                                        color={active ? 'var(--ember-500)' : 'var(--text-secondary)'}
                                        style={{ transition: 'color 0.15s', flexShrink: 0 }}
                                    />
                                    <span style={{
                                        fontSize: '14px', fontWeight: active ? 700 : 500,
                                        color: active ? 'var(--ember-500)' : 'var(--text-secondary)',
                                        fontFamily: 'var(--font-heading)',
                                        transition: 'color 0.15s',
                                    }}>{item.label}</span>

                                    {/* Active indicator */}
                                    {active && (
                                        <motion.div
                                            layoutId="active-indicator"
                                            style={{
                                                marginLeft: 'auto',
                                                width: '6px', height: '6px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--ember-500)',
                                            }}
                                        />
                                    )}
                                </motion.div>
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom actions */}
                <div style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: '16px',
                    display: 'flex', flexDirection: 'column', gap: '8px',
                }}>
                    <ThemeToggle />

                    <motion.button
                        onClick={() => setShowSignOutDialog(true)}
                        disabled={signingOut}
                        whileHover={{ x: 2 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px', borderRadius: '10px',
                            backgroundColor: 'transparent',
                            border: '1px solid transparent',
                            cursor: signingOut ? 'not-allowed' : 'pointer',
                            width: '100%', textAlign: 'left',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.06)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        <LogOut
                            size={17}
                            strokeWidth={2}
                            color={signingOut ? 'var(--text-muted)' : 'var(--text-secondary)'}
                            style={{ transition: 'color 0.15s', flexShrink: 0 }}
                        />
                        <span style={{
                            fontSize: '14px', fontWeight: 500,
                            color: signingOut ? 'var(--text-muted)' : 'var(--text-secondary)',
                            fontFamily: 'var(--font-heading)',
                        }}>
                            {signingOut ? 'Signing out...' : 'Sign out'}
                        </span>
                    </motion.button>
                </div>
            </aside>

            {/* ── MOBILE TOP BAR ── */}
            <div style={{
                display: 'none',
                position: 'fixed', top: 0, left: 0, right: 0,
                zIndex: 50, height: '56px',
                backgroundColor: 'color-mix(in srgb, var(--bg-base) 90%, transparent)',
                backdropFilter: 'blur(16px)',
                borderBottom: '1px solid var(--border)',
                alignItems: 'center', justifyContent: 'space-between',
                padding: '0 16px',
            }} className="mobile-topbar">
                <Link href="/feed" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '28px', height: '28px', borderRadius: '7px',
                        background: 'linear-gradient(135deg, #FF6B35, #E85A24)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-display)', fontWeight: 800,
                        color: 'white', fontSize: '14px',
                    }}>F</div>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)' }}>Flint</span>
                </Link>
                <ThemeToggle />
            </div>

            {/* ── MAIN CONTENT ── */}
            <main style={{ flex: 1, minWidth: 0, paddingBottom: '80px' }} className="app-main">
                {children}
            </main>

            {/* ── MOBILE BOTTOM NAV ── */}
            <nav style={{
                display: 'none',
                position: 'fixed', bottom: 0, left: 0, right: 0,
                zIndex: 50, height: '60px',
                backgroundColor: 'color-mix(in srgb, var(--bg-base) 95%, transparent)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid var(--border)',
                alignItems: 'center', justifyContent: 'space-around',
                padding: '0 8px',
            }} className="mobile-bottom-nav">
                {NAV_ITEMS.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + '/')
                    const Icon = item.icon

                    return (
                        <Link key={item.href} href={item.href} style={{ textDecoration: 'none', flex: 1 }}>
                            <div style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: '3px',
                                padding: '8px 4px',
                            }}>
                                <Icon
                                    size={17}
                                    strokeWidth={2}
                                    color={active ? 'var(--ember-500)' : 'var(--text-secondary)'}
                                    style={{ transition: 'color 0.15s', flexShrink: 0 }}
                                />                                <span style={{
                                    fontSize: '10px', fontWeight: active ? 700 : 500,
                                    color: active ? 'var(--ember-500)' : 'var(--text-muted)',
                                    fontFamily: 'var(--font-heading)',
                                }}>{item.label}</span>
                                {active && (
                                    <div style={{
                                        width: '4px', height: '4px', borderRadius: '50%',
                                        backgroundColor: 'var(--ember-500)',
                                    }} />
                                )}
                            </div>
                        </Link>
                    )
                })}

                {/* Sign out on mobile */}
                <button
                    onClick={() => setShowSignOutDialog(true)}
                    style={{
                        flex: 1, background: 'none', border: 'none',
                        cursor: 'pointer', padding: '8px 4px',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: '3px',
                    }}
                >
                    <LogOut
                        size={17}
                        strokeWidth={2}
                        color="var(--text-muted)"
                        style={{ flexShrink: 0 }}
                    />

                    <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
                        {signingOut ? '...' : 'Sign out'}
                    </span>
                </button>
            </nav>
            <AnimatePresence>
                {showSignOutDialog && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSignOutDialog(false)}
                            style={{
                                position: 'fixed', inset: 0,
                                backgroundColor: 'rgba(0,0,0,0.4)',
                                backdropFilter: 'blur(4px)',
                                zIndex: 200,
                            }}
                        />

                        {/* Dialog */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, x: '-50%', y: '-50%' }}
                            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                            exit={{ opacity: 0, scale: 0.92, x: '-50%', y: '-50%' }}
                            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                            style={{
                                position: 'fixed',
                                top: '50%', left: '50%',
                                // transform: 'translate(-50%, -50%)',
                                zIndex: 201,
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '20px',
                                padding: '28px',
                                width: 'calc(100% - 48px)',
                                maxWidth: '360px',
                                boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
                            }}
                        >
                            {/* Icon */}
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                backgroundColor: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '16px',
                            }}>
                                <LogOut className="w-4 h-4 md:w-6 md:h-6" strokeWidth={2} color="#EF4444" />
                            </div>

                            <h3 className="text-base md:text-lg" style={{
                                fontFamily: 'var(--font-display)',
                                fontWeight: 800,
                                letterSpacing: '-0.5px',
                                color: 'var(--text-primary)', marginBottom: '8px',
                            }}>Sign out?</h3>

                            <p className="text-sm md:text-base text-secondary" style={{
                                color: 'var(--text-secondary)',
                                lineHeight: 1.6, marginBottom: '24px',
                            }}>
                                You'll need to sign back in to access your leads.
                            </p>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <motion.button
                                    onClick={() => setShowSignOutDialog(false)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    style={{
                                        flex: 1, padding: '10px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border)',
                                        backgroundColor: 'var(--bg-surface-raised)',
                                        color: 'var(--text-secondary)',
                                        fontSize: '14px', fontWeight: 600,
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-heading)',
                                    }}
                                >Cancel</motion.button>

                                <motion.button
                                    onClick={handleSignOut}
                                    disabled={signingOut}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    style={{
                                        flex: 1, padding: '10px',
                                        borderRadius: '10px', border: 'none',
                                        backgroundColor: '#EF4444',
                                        color: 'white',
                                        fontSize: '14px', fontWeight: 700,
                                        cursor: signingOut ? 'not-allowed' : 'pointer',
                                        fontFamily: 'var(--font-display)',
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', gap: '6px',
                                        opacity: signingOut ? 0.7 : 1,
                                    }}
                                >
                                    {signingOut ? (
                                        <>
                                            <motion.span
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                                style={{ display: 'inline-flex' }}
                                            >
                                                <LogOut size={14} strokeWidth={2} color="white" />
                                            </motion.span>
                                            Signing out...
                                        </>
                                    ) : (
                                        <>
                                            <LogOut size={14} strokeWidth={2} color="white" />
                                            Yes, sign out
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            <style>{`
                @media (max-width: 768px) {
                    .app-sidebar { display: none !important; }
                    .mobile-topbar { display: flex !important; }
                    .mobile-bottom-nav { display: flex !important; }
                    .app-main { padding-top: 56px; }
                }
            `}</style>
        </div>
    )
}