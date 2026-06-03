import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const AppLogo = () => {
    return (
        <div className="z-50">
            <Link
                href="/"
                className="flex items-center gap-[10px] no-underline"
            >
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <div className="flex items-center gap-[10px]">
                        <div
                            className="
                                        flex h-9 w-9 items-center justify-center
                                        rounded-[10px]
                                        text-[17px] md:text-[18px] font-extrabold text-white
                                        shadow-[0_4px_14px_rgba(255,107,53,0.4)]
                                    "
                            style={{
                                background:
                                    'linear-gradient(135deg, #FF6B35 0%, #E85A24 100%)',
                                fontFamily: 'var(--font-display)',
                            }}
                        >
                            F
                        </div>

                        <span
                            className="
                                        md:text-[19px] text-[18px] lg:text-[20px] font-extrabold
                                        tracking-[-0.5px]
                                        text-[var(--text-primary)]
                                    "
                            style={{
                                fontFamily: 'var(--font-display)',
                            }}
                        >
                            Flint
                        </span>
                    </div>
                </motion.div>
            </Link>
        </div>
    )
}

export default AppLogo


