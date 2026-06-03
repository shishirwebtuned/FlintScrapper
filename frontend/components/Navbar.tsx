'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeToggle } from './ThemeProvider'
import AppLogo from './AppLogo'

export function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handler)
        return () => window.removeEventListener('scroll', handler)
    }, [])

    const links = [
        { href: '#how', label: 'How it works' },
        { href: '#pricing', label: 'Pricing' },
        { href: '#testimonials', label: 'Reviews' },
    ]

    return (
        <>
            <motion.nav
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                className={`sticky top-0 z-[100] transition-all duration-300 ${scrolled
                    ? 'backdrop-blur-[20px] border-b border-[var(--border)]'
                    : 'border-b border-transparent'
                    }`}
                style={{
                    backgroundColor: scrolled
                        ? 'color-mix(in srgb, var(--bg-base) 88%, transparent)'
                        : 'transparent',
                }}
            >
                <div className="mx-auto flex h-[68px] max-w-[1140px] items-center justify-between px-5 md:px-8">

                    {/* Logo */}
                    <AppLogo />

                    {/* Desktop Links */}
                    <div className="hidden items-center gap-1 md:flex">
                        {links.map((link) => (
                            <motion.a
                                key={link.href}
                                href={link.href}
                                whileHover={{
                                    backgroundColor: 'var(--bg-surface)',
                                }}
                                className="
                                    rounded-lg px-[14px] py-2
                                    text-sm font-medium
                                    text-[var(--text-secondary)]
                                    no-underline transition-colors
                                    hover:text-[var(--text-primary)]
                                "
                                style={{
                                    fontFamily: 'var(--font-heading)',
                                }}
                            >
                                {link.label}
                            </motion.a>
                        ))}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2.5">
                        <ThemeToggle />

                        <motion.div whileHover={{ opacity: 0.7 }}>
                            <Link
                                href="/login"
                                className="
                                    hidden md:block
                                    rounded-lg px-[14px] py-2
                                    text-sm font-medium
                                    text-[var(--text-secondary)]
                                    no-underline
                                "
                                style={{
                                    fontFamily: 'var(--font-heading)',
                                }}
                            >
                                Sign in
                            </Link>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.04, y: -1 }}
                            whileTap={{ scale: 0.96 }}
                            className="hidden md:block"
                        >
                            <Link
                                href="/signup"
                                className="
                                    block rounded-[10px]
                                    px-[22px] py-[9px]
                                    text-sm font-bold text-white
                                    no-underline
                                    shadow-[0_4px_14px_rgba(255,107,53,0.35)]
                                "
                                style={{
                                    background:
                                        'linear-gradient(135deg,#FF6B35,#E85A24)',
                                    fontFamily: 'var(--font-display)',
                                    letterSpacing: '0.1px',
                                }}
                            >
                                Get started
                            </Link>
                        </motion.div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="
                                flex h-[38px] w-[38px]
                                flex-col items-center justify-center
                                gap-1 rounded-lg
                                border border-[var(--border)]
                                bg-[var(--bg-surface)]
                                md:hidden
                            "
                        >
                            <motion.div
                                animate={{
                                    rotate: mobileOpen ? 45 : 0,
                                    y: mobileOpen ? 6 : 0,
                                }}
                                className="
                                    h-[2px] w-4 rounded-full
                                    bg-[var(--text-primary)]
                                "
                            />

                            <motion.div
                                animate={{
                                    opacity: mobileOpen ? 0 : 1,
                                }}
                                className="
                                    h-[2px] w-4 rounded-full
                                    bg-[var(--text-primary)]
                                "
                            />

                            <motion.div
                                animate={{
                                    rotate: mobileOpen ? -45 : 0,
                                    y: mobileOpen ? -6 : 0,
                                }}
                                className="
                                    h-[2px] w-4 rounded-full
                                    bg-[var(--text-primary)]
                                "
                            />
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25 }}
                        className="
                            fixed left-0 right-0 top-[68px]
                            z-[99]
                            border-b border-[var(--border)]
                            bg-[var(--bg-base)]
                            px-8 pt-4 pb-6
                            shadow-[0_8px_32px_rgba(0,0,0,0.1)]
                            md:hidden
                        "
                    >
                        {links.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className="
                                    block border-b border-[var(--border)]
                                    py-3 text-base font-medium
                                    text-[var(--text-secondary)]
                                    no-underline
                                "
                                style={{
                                    fontFamily: 'var(--font-heading)',
                                }}
                            >
                                {link.label}
                            </a>
                        ))}

                        <div className="mt-5 flex flex-col gap-2.5">
                            <Link
                                href="/login"
                                onClick={() => setMobileOpen(false)}
                                className="
                                    rounded-[10px]
                                    border border-[var(--border)]
                                    p-3 text-center
                                    text-[15px] font-semibold
                                    text-[var(--text-secondary)]
                                    no-underline
                                "
                                style={{
                                    fontFamily: 'var(--font-heading)',
                                }}
                            >
                                Sign in
                            </Link>

                            <Link
                                href="/signup"
                                onClick={() => setMobileOpen(false)}
                                className="
                                    rounded-[10px]
                                    p-3 text-center
                                    text-[15px] font-bold
                                    text-white no-underline
                                "
                                style={{
                                    background:
                                        'linear-gradient(135deg,#FF6B35,#E85A24)',
                                    fontFamily: 'var(--font-display)',
                                }}
                            >
                                Get started free →
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}