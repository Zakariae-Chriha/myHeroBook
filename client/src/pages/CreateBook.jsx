import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WizardWrapper from '../components/wizard/WizardWrapper.jsx'
import { useBook } from '../context/BookContext.jsx'

export default function CreateBook() {
  const { resetWizard } = useBook()
  const navigate = useNavigate()

  // Fresh wizard on every visit
  useEffect(() => {
    resetWizard()
  }, [])

  const handleComplete = (bookId) => {
    navigate(`/preview/${bookId}`)
  }

  return <WizardWrapper onComplete={handleComplete} />
}
