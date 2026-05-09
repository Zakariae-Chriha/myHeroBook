import { useState, useRef, useCallback } from 'react'
import { voiceService } from '../services/orderService.js'

export function useVoice() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [duration, setDuration] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [voiceId, setVoiceId] = useState(null)
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const intervalRef = useRef(null)

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start(100)
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setDuration(0)

      intervalRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
    } catch {
      setError('Microphone access denied. Please allow microphone access and try again.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    clearInterval(intervalRef.current)
    setIsRecording(false)
  }, [])

  const uploadVoice = useCallback(async () => {
    if (!audioBlob) return
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('voiceSample', audioBlob, 'recording.webm')
      const { data } = await voiceService.uploadSample(form)
      setVoiceId(data.voiceId)
      return data.voiceId
    } catch (err) {
      setError(err.response?.data?.message || 'Voice upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [audioBlob])

  const reset = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
    setVoiceId(null)
    setError(null)
  }, [audioUrl])

  return {
    isRecording,
    audioBlob,
    audioUrl,
    duration,
    uploading,
    voiceId,
    error,
    startRecording,
    stopRecording,
    uploadVoice,
    reset,
  }
}
