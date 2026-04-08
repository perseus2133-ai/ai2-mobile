import { useState } from 'react'

const SESSION_KEY = 'ai2_auth'
const CORRECT_PW = import.meta.env.VITE_APP_PASSWORD ?? 'demo'

export const isAuthenticated = () =>
  sessionStorage.getItem(SESSION_KEY) === 'true'

export default function Login({ onSuccess }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (pw === CORRECT_PW) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      onSuccess()
    } else {
      setError(true)
      setPw('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-white text-2xl font-bold text-center mb-2">AI2</h1>
        <p className="text-gray-400 text-sm text-center mb-8">주식 컨센서스 대시보드</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(false) }}
            placeholder="비밀번호 입력"
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none border border-transparent focus:border-blue-500"
            autoFocus
          />
          {error && (
            <p className="text-red-400 text-sm text-center">비밀번호가 올바르지 않습니다</p>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold text-base"
          >
            입장
          </button>
        </form>
      </div>
    </div>
  )
}
