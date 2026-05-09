import { createContext, useContext, useReducer, useCallback } from 'react'

const BookContext = createContext(null)

const initialWizardState = {
  currentStep: 1,
  // Step 1 — child info
  childName: '',
  childAge: 6,
  childGender: 'girl',
  language: 'en',
  culture: '',
  bestFriendName: '',
  petName: '',
  favoriteColor: '#C9A84C',
  favoriteFood: '',
  hometown: '',
  // Step 2 — photo
  photoFile: null,
  photoPreviewUrl: null,
  artStyle: 'watercolor',
  uploadedPhotoUrl: null,
  childId: null,
  // Step 3 — job
  chosenJob: null,
  customJob: '',
  // Step 4 — personalize
  storyTheme: 'save-the-world',
  episodeNumber: 1,
  dedication: '',
  isGift: false,
  giftRecipient: '',
  // Step 5 — tier
  selectedTier: null,
  shippingAddress: null,
}

function wizardReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'SET_STEP':
      return { ...state, currentStep: action.step }
    case 'NEXT_STEP':
      return { ...state, currentStep: Math.min(state.currentStep + 1, 5) }
    case 'PREV_STEP':
      return { ...state, currentStep: Math.max(state.currentStep - 1, 1) }
    case 'RESET':
      return initialWizardState
    default:
      return state
  }
}

export function BookProvider({ children }) {
  const [wizard, dispatch] = useReducer(wizardReducer, initialWizardState)

  const setField = useCallback((field, value) => {
    dispatch({ type: 'SET_FIELD', field, value })
  }, [])

  const nextStep = useCallback(() => dispatch({ type: 'NEXT_STEP' }), [])
  const prevStep = useCallback(() => dispatch({ type: 'PREV_STEP' }), [])
  const setStep = useCallback((step) => dispatch({ type: 'SET_STEP', step }), [])
  const resetWizard = useCallback(() => dispatch({ type: 'RESET' }), [])

  return (
    <BookContext.Provider value={{ wizard, setField, nextStep, prevStep, setStep, resetWizard }}>
      {children}
    </BookContext.Provider>
  )
}

export const useBook = () => {
  const ctx = useContext(BookContext)
  if (!ctx) throw new Error('useBook must be used within BookProvider')
  return ctx
}
