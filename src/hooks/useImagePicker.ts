import { useState } from 'react'

export function useImagePicker() {
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickImage = async (multiple = false): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      try {
        setLoading(true)
        setError(null)

        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.multiple = multiple
        input.onchange = (e: Event) => {
          const target = e.target as HTMLInputElement
          if (target.files && target.files.length > 0) {
            const files = Array.from(target.files)
            const urls = files.map(file => URL.createObjectURL(file))
            setImages(prev => [...prev, ...urls])
            setLoading(false)
            resolve(urls)
          } else {
            setLoading(false)
            resolve([])
          }
        }
        input.oncancel = () => {
          setLoading(false)
          resolve([])
        }
        input.click()
      } catch (error: any) {
        setError(error.message)
        setLoading(false)
        reject(error)
      }
    })
  }

  const takePhoto = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        setLoading(true)
        setError(null)

        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.capture = 'environment'
        input.onchange = (e: Event) => {
          const target = e.target as HTMLInputElement
          if (target.files && target.files.length > 0) {
            const url = URL.createObjectURL(target.files[0])
            setImages(prev => [...prev, url])
            setLoading(false)
            resolve(url)
          } else {
            setLoading(false)
            reject(new Error('No image selected'))
          }
        }
        input.oncancel = () => {
          setLoading(false)
          reject(new Error('Camera cancelled'))
        }
        input.click()
      } catch (error: any) {
        setError(error.message)
        setLoading(false)
        reject(error)
      }
    })
  }

  const removeImage = (uri: string) => {
    URL.revokeObjectURL(uri)
    setImages(prev => prev.filter(image => image !== uri))
  }

  const clearImages = () => {
    images.forEach(uri => URL.revokeObjectURL(uri))
    setImages([])
  }

  return {
    images,
    loading,
    error,
    pickImage,
    takePhoto,
    removeImage,
    clearImages,
  }
}
