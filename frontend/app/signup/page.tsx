'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import AppLogo from '@/components/AppLogo'

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [form, setForm] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        businessName: '',
        contactName: '',
        phone: '',
    })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

    const router = useRouter()
    const supabase = createClient()

    function update(field: string, value: string) {
        setForm((f) => ({ ...f, [field]: value }))
    }

    async function handleSignup() {
        setMessage(null)

        if (!form.email || !form.password || !form.contactName) {
            return setMessage({ type: 'error', text: 'Please fill in all required fields.' })
        }
        if (form.password !== form.confirmPassword) {
            return setMessage({ type: 'error', text: 'Passwords do not match.' })
        }
        if (form.password.length < 8) {
            return setMessage({ type: 'error', text: 'Password must be at least 8 characters.' })
        }
        const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
        if (!strongPassword.test(form.password)) {
            return setMessage({ type: 'error', text: 'Password must have uppercase, lowercase, and a number.' })
        }

        setLoading(true)

        const { data, error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
                data: {
                    contact_name: form.contactName,
                    business_name: form.businessName,
                    phone: form.phone,
                }
            }
        })

        if (error) {
            setMessage({ type: 'error', text: error.message })
            setLoading(false)
            return
        }

        if (data.user && data.user.identities?.length === 0) {
            setMessage({
                type: 'error',
                text: 'An account with this email already exists. Please sign in instead.'
            })
            setLoading(false)
            return
        }

        setMessage({
            type: 'success',
            text: 'Check your email and click the confirmation link to continue.'
        })
        router.refresh()
        setLoading(false)
    }

    // Password strength indicator
    function getPasswordStrength(p: string): { level: number; label: string; color: string } {
        if (!p) return { level: 0, label: '', color: 'transparent' }
        const checks = [p.length >= 8, /[A-Z]/.test(p), /[a-z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)]
        const score = checks.filter(Boolean).length
        if (score <= 2) return { level: score, label: 'Weak', color: '#EF4444' }
        if (score === 3) return { level: score, label: 'Fair', color: '#F59E0B' }
        if (score === 4) return { level: score, label: 'Good', color: '#3B82F6' }
        return { level: score, label: 'Strong', color: '#22C55E' }
    }

    const strength = getPasswordStrength(form.password)

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '11px 14px',
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
        marginBottom: '7px',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-heading)',
    }

    const EyeOff = () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    )

    const EyeOn = () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--bg-base)',
            display: 'flex',
        }}>

            {/* ── LEFT PANEL ── */}
            <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                className="signup-left"
                style={{
                    display: 'none',
                    width: '44%',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '48px',
                    backgroundColor: 'var(--bg-surface)',
                    borderRight: '1px solid var(--border)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Background effects */}
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 0,
                    background: 'radial-gradient(ellipse 80% 60% at 20% 20%, rgba(255,107,53,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(255,107,53,0.05) 0%, transparent 60%)',
                    pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 0,
                    backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
                    backgroundSize: '40px 40px', opacity: 0.4,
                    maskImage: 'radial-gradient(ellipse 100% 100% at 50% 50%, black 30%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 50% 50%, black 30%, transparent 100%)',
                }} />

                {/* Logo */}
                <AppLogo />

                {/* Middle */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.7 }}
                    style={{ position: 'relative', zIndex: 1 }}
                >
                    <h2 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(36px, 3.5vw, 54px)',
                        fontWeight: 900, lineHeight: 1.0,
                        letterSpacing: '-3px', marginBottom: '20px',
                        color: 'var(--text-primary)',
                    }}>
                        Your next job<br />is{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>waiting.</span>
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, maxWidth: '340px' }}>
                        Join Australian tradies already getting leads delivered to their phone — before anyone else sees them.
                    </p>

                    {/* Feature list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '36px' }}>
                        {[
                            { icon: '⚡', text: 'Leads delivered in under 15 minutes' },
                            { icon: '🎯', text: 'Max 3 tradies matched per lead' },
                            { icon: '🤖', text: 'AI filters out spam and fake posts' },
                            { icon: '📱', text: 'Push notifications to your phone' },
                        ].map((item) => (
                            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px',
                                    backgroundColor: 'rgba(255,107,53,0.1)',
                                    border: '1px solid rgba(255,107,53,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '15px', flexShrink: 0,
                                }}>{item.icon}</div>
                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Bottom */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    style={{
                        position: 'relative', zIndex: 1,
                        borderTop: '1px solid var(--border)', paddingTop: '24px',
                    }}
                >
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
                        {[...Array(5)].map((_, i) => (
                            <span key={i} style={{ color: '#F59E0B', fontSize: '13px' }}>★</span>
                        ))}
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>
                        "Got 3 jobs in my first week. Cancelled HiPages the same day."
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>— Dave, Plumber · Sydney</p>
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
                    padding: '40px 32px',
                    overflowY: 'auto',
                }}
            >
                <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto' }}>

                    {/* Mobile logo */}
                    <div className="signup-mobile-logo mb-[24px]" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #FF6B35, #E85A24)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-display)', fontWeight: 800, color: 'white', fontSize: '16px',
                        }}>F</div>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--text-primary)' }}>Flint</span>
                    </div>

                    {/* Header */}
                    <div style={{ marginBottom: '28px' }}>
                        <h1 className="text-[26px] leading-tight md:leading-none"
                            style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '26px', fontWeight: 800,
                                letterSpacing: '-1px', marginBottom: '6px',
                                color: 'var(--text-primary)',
                            }}>Create your account</h1>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Start getting leads in under 5 minutes
                        </p>
                    </div>

                    {/* Form fields */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Name + Business */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={labelStyle}>
                                    Your name <span style={{ color: 'var(--ember-500)' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.contactName}
                                    onChange={(e) => update('contactName', e.target.value)}
                                    placeholder="Dave Smith"
                                    style={inputStyle}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--ember-500)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Business name</label>
                                <input
                                    type="text"
                                    value={form.businessName}
                                    onChange={(e) => update('businessName', e.target.value)}
                                    placeholder="Smith Plumbing"
                                    style={inputStyle}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--ember-500)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label style={labelStyle}>Phone number</label>
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={(e) => update('phone', e.target.value)}
                                placeholder="04XX XXX XXX"
                                style={inputStyle}
                                onFocus={(e) => e.target.style.borderColor = 'var(--ember-500)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label style={labelStyle}>
                                Email <span style={{ color: 'var(--ember-500)' }}>*</span>
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => update('email', e.target.value)}
                                placeholder="dave@smithplumbing.com.au"
                                style={inputStyle}
                                onFocus={(e) => e.target.style.borderColor = 'var(--ember-500)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label style={labelStyle}>
                                Password <span style={{ color: 'var(--ember-500)' }}>*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={(e) => update('password', e.target.value)}
                                    placeholder="Min. 8 characters"
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
                                        cursor: 'pointer', color: 'var(--text-muted)',
                                        display: 'flex', alignItems: 'center', padding: '4px',
                                    }}
                                >
                                    {showPassword ? <EyeOff /> : <EyeOn />}
                                </button>
                            </div>

                            {/* Password strength bar */}
                            <AnimatePresence>
                                {form.password && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        style={{ marginTop: '8px', overflow: 'hidden' }}
                                    >
                                        <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <div key={i} style={{
                                                    flex: 1, height: '3px', borderRadius: '2px',
                                                    backgroundColor: i <= strength.level ? strength.color : 'var(--border)',
                                                    transition: 'background-color 0.3s',
                                                }} />
                                            ))}
                                        </div>
                                        <span style={{ fontSize: '11px', color: strength.color, fontWeight: 600 }}>
                                            {strength.label}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Confirm password */}
                        <div>
                            <label style={labelStyle}>
                                Confirm password <span style={{ color: 'var(--ember-500)' }}>*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={form.confirmPassword}
                                    onChange={(e) => update('confirmPassword', e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
                                    placeholder="••••••••"
                                    style={{
                                        ...inputStyle,
                                        paddingRight: '44px',
                                        borderColor: form.confirmPassword
                                            ? form.confirmPassword === form.password
                                                ? '#22C55E'
                                                : '#EF4444'
                                            : 'var(--border)',
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--ember-500)'}
                                    onBlur={(e) => {
                                        if (form.confirmPassword) {
                                            e.target.style.borderColor = form.confirmPassword === form.password ? '#22C55E' : '#EF4444'
                                        } else {
                                            e.target.style.borderColor = 'var(--border)'
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{
                                        position: 'absolute', right: '12px',
                                        top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none',
                                        cursor: 'pointer', color: 'var(--text-muted)',
                                        display: 'flex', alignItems: 'center', padding: '4px',
                                    }}
                                >
                                    {showConfirmPassword ? <EyeOff /> : <EyeOn />}
                                </button>
                            </div>

                            {/* Match indicator */}
                            <AnimatePresence>
                                {form.confirmPassword && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        style={{
                                            marginTop: '6px', fontSize: '11px', fontWeight: 600,
                                            color: form.confirmPassword === form.password ? '#22C55E' : '#EF4444',
                                        }}
                                    >
                                        {form.confirmPassword === form.password ? '✓ Passwords match' : '✗ Passwords do not match'}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Message */}
                    <AnimatePresence>
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    marginTop: '16px',
                                    padding: '12px 14px',
                                    borderRadius: '10px',
                                    fontSize: '13px', lineHeight: 1.5,
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
                        onClick={handleSignup}
                        disabled={loading}
                        whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
                        whileTap={!loading ? { scale: 0.98 } : {}}
                        style={{
                            width: '100%', marginTop: '20px',
                            padding: '13px', borderRadius: '10px',
                            border: 'none', fontSize: '15px', fontWeight: 700,
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
                                Creating account...
                            </span>
                        ) : 'Create account →'}
                    </motion.button>

                    {/* Terms note */}
                    <p style={{
                        marginTop: '14px', fontSize: '12px',
                        color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5,
                    }}>
                        By creating an account you agree to our{' '}
                        <a href="#" style={{ color: 'var(--ember-500)', textDecoration: 'none' }}>Terms</a>
                        {' '}and{' '}
                        <a href="#" style={{ color: 'var(--ember-500)', textDecoration: 'none' }}>Privacy Policy</a>
                    </p>

                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>already have an account?</span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Link href="/login" style={{
                            display: 'block', textAlign: 'center',
                            padding: '12px', borderRadius: '10px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-secondary)',
                            textDecoration: 'none', fontSize: '14px', fontWeight: 600,
                            fontFamily: 'var(--font-heading)',
                            transition: 'all 0.2s',
                        }}>
                            Sign in instead
                        </Link>
                    </motion.div>
                </div>
            </motion.div>

            <style>{`
                .signup-left { display: none; }
                .signup-mobile-logo { display: flex; }
                @media (min-width: 1024px) {
                    .signup-left { display: flex !important; }
                    .signup-mobile-logo { display: none !important; }
                }
            `}</style>
        </div>
    )
}