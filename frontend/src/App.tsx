import Navbar from './components/Navbar'
import Hero from './components/Hero'
import TrendingEvents from './components/TrendingEvents'
import Footer from './components/Footer'

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrendingEvents />
      </main>
      <Footer />
    </>
  )
}

export default App
