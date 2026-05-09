import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBook } from '../../context/BookContext.jsx'
import Step1_ChildInfo from './Step1_ChildInfo.jsx'
import Step2_PhotoUpload from './Step2_PhotoUpload.jsx'
import Step3_ChooseJob from './Step3_ChooseJob.jsx'
import Step4_Personalize from './Step4_Personalize.jsx'
import Step5_ChooseTier from './Step5_ChooseTier.jsx'

const STEPS = [
  { number: 1, label: 'Child Info' },
  { number: 2, label: 'Upload Photo' },
  { number: 3, label: 'Dream Job' },
  { number: 4, label: 'Personalise' },
  { number: 5, label: 'Choose Plan' },
]

const STEP_COMPONENTS = {
  1: Step1_ChildInfo,
  2: Step2_PhotoUpload,
  3: Step3_ChooseJob,
  4: Step4_Personalize,
  5: Step5_ChooseTier,
}

const pageVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -48 : 48 }),
}

export default function WizardWrapper({ onComplete }) {
  const { wizard, prevStep } = useBook()
  const { t } = useTranslation('wizard')
  const { currentStep } = wizard

  const StepComponent = STEP_COMPONENTS[currentStep]

  return (
    <div className="min-h-screen bg-bg-primary pt-16">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-bg-primary/95 backdrop-blur-md sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gold-gradient rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-bg-primary" />
              </div>
              <span className="text-white font-semibold text-sm hidden sm:block">Create Your Hero Book</span>
            </div>
            <span className="text-muted text-sm">{t('progress.step', { current: currentStep, total: 5 })}</span>
          </div>

          {/* Progress bar */}
          <div className="relative">
            {/* Track */}
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gold-gradient rounded-full"
                initial={false}
                animate={{ width: `${(currentStep / 5) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              />
            </div>

            {/* Step dots */}
            <div className="absolute inset-0 flex justify-between items-center px-0">
              {STEPS.map((step) => {
                const done = currentStep > step.number
                const active = currentStep === step.number
                return (
                  <div key={step.number} className="flex flex-col items-center gap-1.5">
                    <motion.div
                      animate={{
                        scale: active ? 1.2 : 1,
                        backgroundColor: done ? '#C9A84C' : active ? '#C9A84C' : 'transparent',
                        borderColor: done || active ? '#C9A84C' : 'rgba(255,255,255,0.2)',
                      }}
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center -mt-1.5"
                    >
                      {done ? (
                        <Check className="w-2.5 h-2.5 text-bg-primary" />
                      ) : active ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-bg-primary" />
                      ) : null}
                    </motion.div>
                    <span className={`text-xs hidden md:block ${active ? 'text-gold' : done ? 'text-cream' : 'text-muted'}`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <AnimatePresence mode="wait" custom={1}>
          <motion.div
            key={currentStep}
            custom={1}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <StepComponent onComplete={onComplete} onBack={prevStep} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
