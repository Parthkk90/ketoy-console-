import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { useScreenStore } from '../store/screenStore'
import { screenAPI } from '../services/api'
import MobilePreview from '../components/MobilePreview'
import VersionHistoryModal from '../components/VersionHistoryModal'

export default function ScreenEditorPage() {
  const { packageName, screenName } = useParams()
  const navigate = useNavigate()
  const { currentScreen, setCurrentScreen, jsonContent, setJsonContent } = useScreenStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [editorValue, setEditorValue] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [newVersion, setNewVersion] = useState('')
  const [showVersionInput, setShowVersionInput] = useState(false)

  useEffect(() => {
    fetchScreenDetails()
  }, [packageName, screenName])

  const fetchScreenDetails = async () => {
    setLoading(true)
    try {
      const response = await screenAPI.getDetails(packageName, screenName)
      const screen = response.data.data.screen
      const content = response.data.data.jsonContent
      
      setCurrentScreen(screen)
      setJsonContent(content)
      
      // Pretty print JSON for editor
      const formatted = typeof content === 'string' 
        ? JSON.stringify(JSON.parse(content), null, 2)
        : JSON.stringify(content, null, 2)
      
      setEditorValue(formatted)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch screen details')
    } finally {
      setLoading(false)
    }
  }

  const handleEditorChange = (value) => {
    setEditorValue(value)
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!newVersion.trim()) {
      setShowVersionInput(true)
      setError('Please enter a version number (e.g., 1.0.1, 2.0.0)')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Validate JSON
      JSON.parse(editorValue)
      
      const response = await screenAPI.update(packageName, screenName, {
        jsonContent: editorValue,
        version: newVersion.trim()
      })
      
      setJsonContent(editorValue)
      setHasChanges(false)
      setNewVersion('')
      setShowVersionInput(false)
      alert(`Screen saved successfully as version ${newVersion}!`)
      
      // Reload to get updated version info
      fetchScreenDetails()
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your JSON.')
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to save screen')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleLoadVersion = (versionContent) => {
    setEditorValue(versionContent)
    setHasChanges(true)
    setShowVersionInput(true)
  }

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(editorValue)
      const formatted = JSON.stringify(parsed, null, 2)
      setEditorValue(formatted)
    } catch (err) {
      alert('Invalid JSON format. Cannot format.')
    }
  }

  const handleRevert = () => {
    if (hasChanges && !confirm('Discard all changes?')) return
    
    const formatted = typeof jsonContent === 'string' 
      ? JSON.stringify(JSON.parse(jsonContent), null, 2)
      : JSON.stringify(jsonContent, null, 2)
    
    setEditorValue(formatted)
    setHasChanges(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">Loading screen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Header */}
      <div className="bg-[#1a2332] border-b border-gray-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <Link to="/projects" className="text-gray-400 hover:text-white">
                App
              </Link>
              <span className="text-gray-600">/</span>
              <Link to={`/projects/${packageName}`} className="text-gray-400 hover:text-white">
                {packageName}
              </Link>
              <span className="text-gray-600">/</span>
              <span className="text-white">{currentScreen?.displayName || screenName}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowVersionHistory(true)}
              className="px-3 py-2 text-gray-400 hover:text-white hover:bg-[#0f1c2e] rounded-lg transition-colors flex items-center gap-2"
              title="Version History"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">History</span>
            </button>

            <div className="h-6 w-px bg-gray-700"></div>
            
            <button
              onClick={handleFormatJson}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#0f1c2e] rounded-lg transition-colors"
              title="Format JSON"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </button>
            
            <button
              onClick={handleRevert}
              disabled={!hasChanges}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#0f1c2e] rounded-lg transition-colors disabled:opacity-30"
              title="Revert changes"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>

            {showVersionInput && (
              <input
                type="text"
                placeholder="New version (e.g., 1.1.0)"
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                className="px-3 py-2 text-sm bg-[#0f1c2e] border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white w-44"
              />
            )}

            <button
              onClick={() => {
                if (!showVersionInput) {
                  setShowVersionInput(true)
                } else {
                  handleSave()
                }
              }}
              disabled={saving || !hasChanges}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            >
              {saving ? 'Saving...' : showVersionInput && newVersion ? 'Save' : hasChanges ? 'Save Version' : 'Saved'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Editor and Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: JSON Editor */}
        <div className="flex-1 flex flex-col border-r border-gray-800">
          <div className="bg-[#1a2332] px-4 py-2 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-300">
              <span className="text-gray-500">{'{}'}</span> {screenName}.json
            </h2>
            {hasChanges && (
              <span className="text-xs text-yellow-400">● Unsaved changes</span>
            )}
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={editorValue}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 2,
                formatOnPaste: true,
                formatOnType: true
              }}
            />
          </div>
        </div>

        {/* Right: Mobile Preview */}
        <div className="w-[400px] flex flex-col bg-[#1a2332]">
          <div className="px-4 py-2 border-b border-gray-800">
            <h2 className="text-sm font-medium text-gray-300">Preview</h2>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            {/* Mobile Frame */}
            <div className="relative">
              <div className="w-[300px] h-[600px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-[14px] border-gray-900">
                <div className="w-full h-full overflow-auto">
                  <MobilePreview jsonContent={editorValue} />
                </div>
              </div>
              {/* Notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-[28px] bg-gray-900 rounded-b-2xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        packageName={packageName}
        screenName={screenName}
        onLoadVersion={handleLoadVersion}
      />
    </div>
  )
}
