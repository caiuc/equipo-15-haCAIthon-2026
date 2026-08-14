import { useState } from 'react'
import './App.css'

function App() {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:3001/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'Hello World' }),
      })
      const data = await res.json()
      setResponse(data.reply)
    } catch (error) {
      console.error('Error:', error)
      setResponse('Error al conectar con el backend')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mobile-container">
      <header className="app-header">
        <h1>Mi Boceto App</h1>
      </header>
      
      <main className="content">
        <div className="card">
          <h2>Landing Page</h2>
          <p>Presiona el botón para enviar un "Hello World" al servidor.</p>
          
          <button 
            className="main-button" 
            onClick={sendMessage}
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar Hello World'}
          </button>

          {response && (
            <div className="response-area">
              <p className="response-text">{response}</p>
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>Boceto v1.0 - Frontend & Backend</p>
      </footer>
    </div>
  )
}

export default App
