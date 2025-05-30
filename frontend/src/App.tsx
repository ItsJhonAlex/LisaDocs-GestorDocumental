function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold text-gray-900">
          🚀 LisaDocs
        </h1>
        <p className="text-xl text-gray-600 max-w-md">
          Sistema de Gestión Documental
        </p>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              ✅ Vite + React + TypeScript
            </h2>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              ✅ Tailwind CSS (PostCSS)
            </h2>
            <h2 className="text-lg font-semibold text-green-600">
              🎉 ¡Todo funcionando!
            </h2>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
            Empezar con LisaDocs
          </button>
        </div>
        <div className="text-sm text-gray-500">
          Creado por Jonathan Alejandro Rodriguez Lopes 💪
        </div>
      </div>
    </div>
  )
}

export default App
