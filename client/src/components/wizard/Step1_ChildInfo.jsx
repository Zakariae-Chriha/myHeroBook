import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useBook } from '../../context/BookContext.jsx'
import { useTranslation } from 'react-i18next'
import { LANGUAGES, CULTURES } from '../../utils/constants.js'

const schema = z.object({
  childName: z.string().trim().min(1, 'Name is required').max(50),
  childAge: z.coerce.number().int().min(1).max(12),
  childGender: z.enum(['boy', 'girl', 'other']),
  language: z.string().min(1, 'Language is required'),
  culture: z.string().optional(),
  bestFriendName: z.string().max(50).optional(),
  petName: z.string().max(50).optional(),
  favoriteColor: z.string().optional(),
  favoriteFood: z.string().max(100).optional(),
  hometown: z.string().max(100).optional(),
})

const COLOR_SWATCHES = [
  '#E85454', '#F97316', '#EAB308', '#C9A84C',
  '#22C55E', '#14B8A6', '#3B82F6', '#8B5CF6',
  '#EC4899', '#F5EDD6', '#FFFFFF', '#6B7A99',
]

export default function Step1_ChildInfo() {
  const { wizard, setField, nextStep } = useBook()
  const { t } = useTranslation('wizard')

  const GENDER_OPTIONS = [
    { value: 'girl', label: t('step1.gender_girl'), emoji: '👧' },
    { value: 'boy', label: t('step1.gender_boy'), emoji: '👦' },
    { value: 'other', label: t('step1.gender_other'), emoji: '🧒' },
  ]

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      childName: wizard.childName,
      childAge: wizard.childAge,
      childGender: wizard.childGender,
      language: wizard.language,
      culture: wizard.culture,
      bestFriendName: wizard.bestFriendName,
      petName: wizard.petName,
      favoriteColor: wizard.favoriteColor,
      favoriteFood: wizard.favoriteFood,
      hometown: wizard.hometown,
    },
  })

  const selectedColor = watch('favoriteColor', wizard.favoriteColor)
  const childName = watch('childName', wizard.childName)

  const onSubmit = (data) => {
    Object.entries(data).forEach(([k, v]) => setField(k, v))
    nextStep()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Header */}
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-3xl font-heading font-bold text-white mb-2">
            {t('step1.title')}{' '}
            <span className="gold-text">{t('step1.titleHighlight')}</span>
          </h2>
          <p className="text-muted">{t('step1.subtitle')}</p>
        </motion.div>
      </div>

      <div className="space-y-7">
        {/* Name + Age row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label">{t('step1.childName')} *</label>
            <input
              {...register('childName')}
              type="text"
              placeholder="Emma"
              className="input-field"
              autoFocus
            />
            {errors.childName && <p className="text-error text-xs mt-1">{errors.childName.message}</p>}
          </div>
          <div>
            <label className="label">{t('step1.childAge')} *</label>
            <Controller
              name="childAge"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={1}
                      max={12}
                      {...field}
                      className="flex-1 accent-gold cursor-pointer"
                    />
                    <span className="w-14 h-10 bg-bg-primary border border-gold/30 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
                      {field.value}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted px-0.5">
                    <span>1</span><span>6</span><span>12</span>
                  </div>
                </div>
              )}
            />
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="label">{t('step1.gender')} *</label>
          <Controller
            name="childGender"
            control={control}
            render={({ field }) => (
              <div className="flex gap-3">
                {GENDER_OPTIONS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => field.onChange(g.value)}
                    className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                      field.value === g.value
                        ? 'border-gold bg-gold/10 shadow-gold-glow'
                        : 'border-white/10 hover:border-white/25 bg-bg-secondary'
                    }`}
                  >
                    <span className="text-3xl">{g.emoji}</span>
                    <span className={`text-sm font-medium ${field.value === g.value ? 'text-gold' : 'text-cream'}`}>
                      {g.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        {/* Language + Culture */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label">{t('step1.language')} *</label>
            <select {...register('language')} className="input-field">
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.native} — {l.label}</option>
              ))}
            </select>
            {errors.language && <p className="text-error text-xs mt-1">{errors.language.message}</p>}
          </div>
          <div>
            <label className="label">{t('step1.culture')}</label>
            <select {...register('culture')} className="input-field">
              <option value="">— any / global —</option>
              {CULTURES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Best friend + Pet */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label">{t('step1.bestFriend')}</label>
            <input
              {...register('bestFriendName')}
              type="text"
              placeholder="Lucas"
              className="input-field"
            />
          </div>
          <div>
            <label className="label">{t('step1.pet')}</label>
            <input
              {...register('petName')}
              type="text"
              placeholder="Biscuit"
              className="input-field"
            />
          </div>
        </div>

        {/* Favorite color */}
        <div>
          <label className="label">{t('step1.favoriteColor')}</label>
          <Controller
            name="favoriteColor"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_SWATCHES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => field.onChange(color)}
                    className={`w-9 h-9 rounded-full border-2 transition-all duration-200 cursor-pointer hover:scale-110 ${
                      field.value === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <input
                  type="color"
                  value={field.value || '#C9A84C'}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="w-9 h-9 rounded-full cursor-pointer border-2 border-white/20 bg-transparent overflow-hidden"
                  title="Custom colour"
                />
                {field.value && (
                  <div className="flex items-center gap-1.5 ml-2">
                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: field.value }} />
                    <span className="text-xs text-muted font-mono">{field.value}</span>
                  </div>
                )}
              </div>
            )}
          />
        </div>

        {/* Food + Hometown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label">{t('step1.favoriteFood')}</label>
            <input {...register('favoriteFood')} type="text" placeholder={t('step1.placeholder_food')} className="input-field" />
          </div>
          <div>
            <label className="label">{t('step1.hometown')}</label>
            <input {...register('hometown')} type="text" placeholder={t('step1.placeholder_hometown')} className="input-field" />
          </div>
        </div>

        {/* Live title preview */}
        {childName && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gold/5 border border-gold/20 rounded-xl p-4 text-center"
          >
            <p className="text-muted text-xs mb-1">Your book will be called…</p>
            <p className="font-accent text-gold text-xl">
              {childName} and the [Dream Job] Adventure!
            </p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-10 flex justify-end">
        <button type="submit" className="btn-primary flex items-center gap-2 px-8 py-3">
          {t('nav.next')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  )
}
