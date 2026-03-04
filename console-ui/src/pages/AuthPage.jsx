import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { developerAPI } from '../services/api'
import Antigravity from '../components/Antigravity'

export default function AuthPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isLogin, setIsLogin] = useState(true)
  const [registeredApiKey, setRegisteredApiKey] = useState(null)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    apiKey: '',
    email: '',
    name: '',
    phone: '',
    company: '',
    website: ''
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // LOGIN: verify the API key by calling GET /api/developers/profile
  // The interceptor in api.js auto-attaches x-developer-api-key from localStorage
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { apiKey } = formData
      // Temporarily store key so the interceptor can attach it
      localStorage.setItem('developerApiKey', apiKey)
      const response = await developerAPI.getProfile()
      const developer = response.data.data.developer
      localStorage.setItem('developer', JSON.stringify(developer))
      setAuth(developer, apiKey)
      navigate('/projects')
    } catch (err) {
      localStorage.removeItem('developerApiKey')
      setError(err.response?.data?.error || 'Invalid API key. Please check and try again.')
    } finally {
      setLoading(false)
    }
  }

  // REGISTER: POST /api/developers/register → returns developer + apiKey
  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { email, name, phone, company, website } = formData
      const contactDetails = {}
      if (phone) contactDetails.phone = phone
      if (company) contactDetails.company = company
      if (website) contactDetails.website = website

      const response = await developerAPI.register({ email, name, contactDetails })
      const { apiKey, developer } = response.data.data
      setRegisteredApiKey(apiKey)
      // Auto-login after registration
      localStorage.setItem('developerApiKey', apiKey)
      localStorage.setItem('developer', JSON.stringify(developer))
      setAuth(developer, apiKey)
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(registeredApiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Placeholder so rest of file compiles (was used for reset flow)
  const handleRequestReset = async (e) => {
    e.preventDefault()
  }

  // No password reset on the deployed backend — developers use their API key to login

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <Antigravity
          count={300}
          magnetRadius={10}
          ringRadius={10}
          waveSpeed={0.4}
          waveAmplitude={1}
          particleSize={1.5}
          lerpSpeed={0.05}
          color="#3b82f6"
          autoAnimate
          particleVariance={1}
          rotationSpeed={0}
          depthFactor={1}
          pulseSpeed={3}
          particleShape="box"
          fieldStrength={10}
        />
      </div>

      {/* Content */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-4">
          <div className="inline-block mx-auto mb-2">
            <img 
              src="/ketoy-logo.jpeg" 
              alt="Ketoy Logo" 
              className="w-14 h-14 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Welcome to <span className="text-blue-400">Ketoy</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Easily integrate Ketoy in your ecosystem with out-of-the-box server driven operations.
          </p>
        </div>

        {/* Auth Forms */}

        {/* Post-registration: show API key */}
        {registeredApiKey ? (
          <div className="bg-[#1a2332]/95 backdrop-blur-md rounded-lg p-5 shadow-2xl border border-green-500/50">
            <div className="text-green-400 font-semibold text-base mb-1">Registration Successful!</div>
            <p className="text-xs text-gray-400 mb-4">Save your API key below. This is the only time it will be shown. You will need it to log in.</p>
            <div className="bg-[#0f1c2e] border border-gray-700 rounded-lg p-3 mb-3 break-all font-mono text-sm text-blue-300">
              {registeredApiKey}
            </div>
            <button
              onClick={handleCopyApiKey}
              className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors mb-3"
            >
              {copied ? 'Copied!' : 'Copy API Key'}
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="bg-[#1a2332]/95 backdrop-blur-md rounded-lg p-5 shadow-2xl border border-gray-800/50">
            <h2 className="text-lg font-semibold mb-1">
              {isLogin ? 'Login to Your Account' : 'Register as Developer'}
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              {isLogin
                ? 'Enter your Developer API Key to access your dashboard'
                : 'Create your developer account to start building with Ketoy'
              }
            </p>

            {error && (
              <div className="mb-3 p-2 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-2.5">
              {isLogin ? (
                <>
                  <input
                    type="text"
                    name="apiKey"
                    placeholder="Your Developer API Key"
                    value={formData.apiKey}
                    onChange={handleChange}
                    required
                    autoComplete="off"
                    className="w-full px-3 py-2 text-sm bg-[#0f1c2e] border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white font-mono"
                  />
                  <p className="text-xs text-gray-500">Your API key was shown once when you registered.</p>
                </>
              ) : (
                <>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm bg-[#0f1c2e] border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  />
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm bg-[#0f1c2e] border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm bg-[#0f1c2e] border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  />
                  <input
                    type="text"
                    name="company"
                    placeholder="Company (optional)"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-[#0f1c2e] border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  />
                  <input
                    type="url"
                    name="website"
                    placeholder="Website (optional)"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-[#0f1c2e] border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  />
                  <div className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
                    After registering, you'll receive a unique API Key. Save it — it's your login credential.
                  </div>
                </>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/20 mt-3"
              >
                {loading ? (isLogin ? 'Verifying...' : 'Creating account...') : (isLogin ? 'Login' : 'Register')}
              </button>
            </form>

            <p className="text-xs text-gray-500 mt-4 text-center leading-tight">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>

            <div className="border-t border-gray-700 mt-4 pt-3">
              <p className="text-xs text-center">
                <span className="text-gray-400">
                  {isLogin ? "Don't have an account? " : 'Already registered? '}
                </span>
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(null) }}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  {isLogin ? 'Register here' : 'Login here'}
                </button>
              </p>
            </div>

            <p className="text-xs text-center mt-3">
              <span className="text-gray-400">Facing issues? </span>
              <a href="#" className="text-blue-400 hover:text-blue-300">Connect with us</a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
