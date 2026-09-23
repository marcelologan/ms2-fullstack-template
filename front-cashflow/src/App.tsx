import { Header } from "./components/Header"
import { Footer } from "./components/Footer"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Login } from "./components/pages/Login"
import { Dashboard } from "./components/pages/Dashboard"

function App() {

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 flex flex-col">

        <Header />


        <main className="flex-grow max-w-6xl w-full mx-auto p-8">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>


        <Footer />
      </div>
    </BrowserRouter>
    //Componente PAI


  )
}

export default App