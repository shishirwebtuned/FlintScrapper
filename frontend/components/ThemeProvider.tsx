'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type Theme = 'light' | 'dark'
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
    theme: 'light', toggle: () => { },
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('light')

    useEffect(() => {
        const saved = localStorage.getItem('flint-theme') as Theme | null
        const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        const initial = saved || preferred
        setTheme(initial)
        document.documentElement.setAttribute('data-theme', initial)
    }, [])

    function toggle() {
        const next = theme === 'light' ? 'dark' : 'light'
        setTheme(next)
        localStorage.setItem('flint-theme', next)
        document.documentElement.setAttribute('data-theme', next)
    }

    return (
        <ThemeContext.Provider value={{ theme, toggle }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    return useContext(ThemeContext)
}

export function ThemeToggle() {
    const { theme, toggle } = useTheme()

    return (
        <motion.button
            onClick={toggle}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Toggle theme"
            style={{
                width: '38px', height: '38px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                transition: 'background-color 0.2s, border-color 0.2s',
            }}
        >
            <motion.span
                key={theme}
                initial={{ rotate: -30, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                {theme === 'light' ? '🌙' : '☀️'}
            </motion.span>
        </motion.button>
    )
}