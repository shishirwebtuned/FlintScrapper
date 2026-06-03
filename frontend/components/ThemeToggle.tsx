'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
    const { theme, toggle } = useTheme()

    return (
        <button
            onClick={toggle}
            aria-label="Toggle theme"
            style={{
                width: '36px', height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-surface-raised)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px',
                transition: 'all 0.2s ease',
            }}
        >
            {theme === 'light'
                ? <Moon size={16} strokeWidth={2} color="var(--text-secondary)" />
                : <Sun size={16} strokeWidth={2} color="var(--text-secondary)" />
            }
        </button>
    )
}