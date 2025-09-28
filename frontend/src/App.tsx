import { Routes, Route } from "react-router-dom"
import HomePage from "@/pages/home"
import MatchPage from "@/pages/match"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/match/:id" element={<MatchPage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  )
}