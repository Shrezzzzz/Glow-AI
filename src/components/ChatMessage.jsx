import { motion } from 'framer-motion'
import { Sparkles, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

/**
 * ChatMessage — solid, high-contrast bubbles for both user and bot.
 * Bot: dark gold-tinted background #1e1d1a, white text, visible border
 * User: dark charcoal background #1e1e1f, white text
 */
export default function ChatMessage({ message, isUser }) {
  if (!message) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`flex gap-2.5 w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
          isUser
            ? 'border-white/15'
            : 'border-yellow-600/40'
        }`}
        style={{ backgroundColor: isUser ? '#2a2a2b' : '#1a1a1b' }}
      >
        {isUser
          ? <User size={13} className="text-white/70" />
          : <Sparkles size={13} className="text-yellow-400" />
        }
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 font-inter text-sm leading-relaxed ${
          isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'
        }`}
        style={
          isUser
            ? { backgroundColor: '#252526', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.1)' }
            : { backgroundColor: '#1e1d1a', color: 'rgba(255,255,255,0.92)', border: '1px solid rgba(212,175,106,0.25)' }
        }
      >
        <ReactMarkdown
          components={{
            p:      ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold text-yellow-300">{children}</strong>,
            em:     ({ children }) => <em className="italic text-white/80">{children}</em>,
            ul:     ({ children }) => <ul className="ml-4 list-disc my-2 space-y-1">{children}</ul>,
            ol:     ({ children }) => <ol className="ml-4 list-decimal my-2 space-y-1">{children}</ol>,
            li:     ({ children }) => <li className="text-white/85">{children}</li>,
            h1:     ({ children }) => <h1 className="text-base font-playfair font-semibold text-yellow-300 mb-1">{children}</h1>,
            h2:     ({ children }) => <h2 className="text-sm font-playfair font-semibold text-yellow-300 mb-1">{children}</h2>,
            h3:     ({ children }) => <h3 className="text-sm font-semibold text-yellow-200 mb-0.5">{children}</h3>,
            code:   ({ children }) => <code className="text-[11px] bg-black/30 px-1.5 py-0.5 rounded text-yellow-200">{children}</code>,
            blockquote: ({ children }) => <blockquote className="border-l-2 border-yellow-500/50 pl-3 italic text-white/70 my-2">{children}</blockquote>,
          }}
        >
          {message}
        </ReactMarkdown>
      </div>
    </motion.div>
  )
}
