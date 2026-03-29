import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const COGNITO_REGION = import.meta.env.VITE_COGNITO_REGION || 'ap-south-1'
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID
const COGNITO_ENDPOINT = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`

const decodeJwtPayload = (token) => {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(base64)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export default function AuthPage() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const { developerToken, setAuth } = useAuthStore((state) => ({
    developerToken: state.developerToken,
    setAuth: state.setAuth
  }))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isNewPasswordRequired, setIsNewPasswordRequired] = useState(false)
  const [challengeSession, setChallengeSession] = useState('')
  const [refreshTokenInMemory, setRefreshTokenInMemory] = useState(null)
  const [rememberMe, setRememberMe] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    newPassword: ''
  })

  useEffect(() => {
    if (developerToken) {
      navigate('/', { replace: true })
    }
  }, [developerToken, navigate])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const state = {
      dots: [],
      width: 0,
      height: 0,
      gap: 20,
      dotSize: 2,
      proximity: 120,
      cursor: { x: -9999, y: -9999 },
      pushEvents: []
    }

    const hexToRgb = (hex) => {
      const cleaned = hex.replace('#', '')
      const value = parseInt(cleaned, 16)
      return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255
      }
    }

    const blend = (base, active, t) => ({
      r: Math.round(base.r + (active.r - base.r) * t),
      g: Math.round(base.g + (active.g - base.g) * t),
      b: Math.round(base.b + (active.b - base.b) * t)
    })

    const baseColor = hexToRgb('#1a1a2e')
    const activeColor = hexToRgb('#1A73E8')

    const buildGrid = () => {
      const dpr = window.devicePixelRatio || 1
      state.width = window.innerWidth
      state.height = window.innerHeight

      canvas.width = Math.floor(state.width * dpr)
      canvas.height = Math.floor(state.height * dpr)
      canvas.style.width = `${state.width}px`
      canvas.style.height = `${state.height}px`

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)

      state.dots = []
      for (let y = state.gap / 2; y < state.height; y += state.gap) {
        for (let x = state.gap / 2; x < state.width; x += state.gap) {
          state.dots.push({
            x,
            y,
            offsetX: 0,
            offsetY: 0
          })
        }
      }
    }

    const easeOutQuad = (t) => 1 - (1 - t) * (1 - t)

    let rafId = 0
    const render = () => {
      ctx.clearRect(0, 0, state.width, state.height)

      const now = performance.now()
      state.pushEvents = state.pushEvents.filter((event) => now - event.start < 300)

      for (const dot of state.dots) {
        let pushX = 0
        let pushY = 0

        for (const event of state.pushEvents) {
          const elapsed = now - event.start
          const progress = Math.min(elapsed / 300, 1)
          const distX = dot.x - event.x
          const distY = dot.y - event.y
          const dist = Math.hypot(distX, distY)
          if (dist > event.radius || dist === 0) continue

          const dirX = distX / dist
          const dirY = distY / dist
          const strength = (1 - dist / event.radius) * event.force
          const pulse = progress < 0.5
            ? easeOutQuad(progress * 2)
            : 1 - easeOutQuad((progress - 0.5) * 2)

          pushX += dirX * strength * pulse
          pushY += dirY * strength * pulse
        }

        dot.offsetX += (pushX - dot.offsetX) * 0.2
        dot.offsetY += (pushY - dot.offsetY) * 0.2

        const drawX = dot.x + dot.offsetX
        const drawY = dot.y + dot.offsetY
        const cursorDist = Math.hypot(state.cursor.x - drawX, state.cursor.y - drawY)
        const t = Math.max(0, 1 - cursorDist / state.proximity)
        const c = blend(baseColor, activeColor, t)

        ctx.fillStyle = `rgb(${c.r}, ${c.g}, ${c.b})`
        ctx.fillRect(drawX - state.dotSize / 2, drawY - state.dotSize / 2, state.dotSize, state.dotSize)
      }

      rafId = window.requestAnimationFrame(render)
    }

    const onMouseMove = (event) => {
      state.cursor.x = event.clientX
      state.cursor.y = event.clientY
    }

    const onMouseLeave = () => {
      state.cursor.x = -9999
      state.cursor.y = -9999
    }

    const onClick = (event) => {
      state.pushEvents.push({
        x: event.clientX,
        y: event.clientY,
        radius: 200,
        force: 14,
        start: performance.now()
      })
    }

    const onResize = () => {
      buildGrid()
    }

    buildGrid()
    rafId = window.requestAnimationFrame(render)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('click', onClick)
    window.addEventListener('resize', onResize)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('click', onClick)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const getCognitoErrorMessage = (responseBody) => {
    if (!responseBody) return 'Authentication failed'
    const message = responseBody.message || responseBody.Message
    if (message) return message

    if (responseBody.__type) {
      return String(responseBody.__type).split('#').pop() || 'Authentication failed'
    }

    return 'Authentication failed'
  }

  const finalizeSession = ({ idToken, refreshToken, username }) => {
    const claims = decodeJwtPayload(idToken) || {}
    const cognitoDeveloper = {
      ...claims,
      email: claims.email,
      username,
      sub: claims.sub
    }

    setAuth(cognitoDeveloper, idToken, username)
    if (refreshToken) {
      setRefreshTokenInMemory(refreshToken)
    }

    navigate('/', { replace: true })
  }

  const handlePasswordSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!COGNITO_CLIENT_ID) {
      setError('Missing VITE_COGNITO_CLIENT_ID in environment configuration.')
      setLoading(false)
      return
    }

    try {
      const username = formData.username.trim()
      const response = await fetch(COGNITO_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
        },
        body: JSON.stringify({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: COGNITO_CLIENT_ID,
          AuthParameters: {
            USERNAME: username,
            PASSWORD: formData.password
          }
        })
      })

      const body = await response.json()
      if (!response.ok) {
        throw new Error(getCognitoErrorMessage(body))
      }

      if (body.AuthenticationResult?.IdToken) {
        finalizeSession({
          idToken: body.AuthenticationResult.IdToken,
          refreshToken: body.AuthenticationResult.RefreshToken,
          username
        })
        return
      }

      if (body.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
        setChallengeSession(body.Session || '')
        setIsNewPasswordRequired(true)
        return
      }

      throw new Error('Unexpected authentication response from Cognito.')
    } catch (err) {
      setError(err?.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleNewPasswordSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!COGNITO_CLIENT_ID) {
      setError('Missing VITE_COGNITO_CLIENT_ID in environment configuration.')
      setLoading(false)
      return
    }

    try {
      const username = formData.username.trim()
      const response = await fetch(COGNITO_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.RespondToAuthChallenge'
        },
        body: JSON.stringify({
          ChallengeName: 'NEW_PASSWORD_REQUIRED',
          ClientId: COGNITO_CLIENT_ID,
          Session: challengeSession,
          ChallengeResponses: {
            USERNAME: username,
            NEW_PASSWORD: formData.newPassword
          }
        })
      })

      const body = await response.json()
      if (!response.ok) {
        throw new Error(getCognitoErrorMessage(body))
      }

      if (!body.AuthenticationResult?.IdToken) {
        throw new Error('Cognito did not return an ID token after password challenge.')
      }

      finalizeSession({
        idToken: body.AuthenticationResult.IdToken,
        refreshToken: body.AuthenticationResult.RefreshToken,
        username
      })
    } catch (err) {
      setError(err?.message || 'Failed to set new password')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <>
      <style>{`
        .auth-page-bg {
          background: #020817;
          font-family: 'Inter', sans-serif;
        }

        .dot-grid-canvas {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
        }

        .auth-glass-card {
          position: relative;
          width: 100%;
          max-width: 500px;
          padding: 36px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 24px 80px rgba(2, 8, 23, 0.55);
        }

        .auth-glass-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.3) 0%,
            rgba(255, 255, 255, 0.05) 50%,
            rgba(255, 255, 255, 0.3) 100%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .auth-input {
          width: 100%;
          border-radius: 12px;
          padding: 12px 16px;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .auth-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .auth-input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 0 20px rgba(26, 115, 232, 0.15);
        }

        .auth-submit {
          width: 100%;
          border: none;
          border-radius: 12px;
          padding: 12px;
          color: #ffffff;
          font-weight: 600;
          background: linear-gradient(135deg, #1A73E8, #42A5F5);
          transition: transform 0.2s ease, filter 0.2s ease;
        }

        .auth-submit:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .auth-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
          filter: none;
        }
      `}</style>

      <div className="auth-page-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <canvas ref={canvasRef} className="dot-grid-canvas" />

        <div className="w-full max-w-[500px] relative z-10">
          <div className="auth-glass-card">
            <button
              type="button"
              onClick={() => {
                window.location.href = 'https://ketoy.dev'
              }}
              className="absolute top-4 left-4 text-[13px] text-white/60 hover:text-white transition-colors bg-transparent border-0"
            >
              ← Back
            </button>

            <div className="text-center mb-6 mt-2">
              <div className="inline-flex items-center justify-center mx-auto mb-4 h-10">
                <img src="/T_ketoy_logo.png" alt="Ketoy" height="44" className="h-11 w-11 object-contain" />
              </div>
              <h1 className="text-3xl font-semibold text-white">Welcome back</h1>
              <p className="text-white/65 text-sm mt-2">Sign in to Ketoy Console</p>
            </div>

          {loading && (
            <div className="mb-3 p-2 bg-blue-500/10 border border-blue-500/40 rounded-lg text-blue-300 text-xs">
              Processing authentication. Please wait...
            </div>
          )}

          {error && (
            <div className="mb-3 p-2 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-xs">
              {error}
            </div>
          )}

          {!isNewPasswordRequired ? (
            <form onSubmit={handlePasswordSignIn} className="space-y-2.5">
              <p className="text-xs text-white/70">Username</p>
              <input
                type="text"
                name="username"
                placeholder="Username or email"
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="auth-input text-sm"
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="auth-input text-sm"
              />

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 text-white/70">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-white/30 bg-white/10"
                  />
                  Remember me
                </label>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-submit text-sm"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleNewPasswordSubmit} className="space-y-2.5">
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/40 rounded-lg text-yellow-300 text-xs">
                New password required. Set a new password to complete sign-in.
              </div>

              <input
                type="password"
                name="newPassword"
                placeholder="New password"
                value={formData.newPassword}
                onChange={handleChange}
                required
                className="auth-input text-sm"
              />

              <button
                type="submit"
                disabled={loading}
                className="auth-submit text-sm"
              >
                {loading ? 'Submitting...' : 'Set new password'}
              </button>
            </form>
          )}
          </div>
        </div>
      </div>
    </>
  )
}
