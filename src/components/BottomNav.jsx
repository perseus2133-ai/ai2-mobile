export default function BottomNav({ tab, onChange }) {
  const tabs = [
    { key: 'list', label: '종목', icon: '📊' },
    { key: 'sector', label: '섹터', icon: '🏭' },
  ]
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-800 flex">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-xs ${
            tab === t.key ? 'text-blue-400' : 'text-gray-500'
          }`}
        >
          <span className="text-xl">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
