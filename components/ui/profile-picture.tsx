'use client'

import { useState, useEffect } from 'react'

interface ProfilePictureProps {
  user: {
    id: string
    name?: string
    picture?: string
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ProfilePicture({ user, className = '', size = 'md' }: ProfilePictureProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

  useEffect(() => {
    if (user.picture) {
      console.log('ProfilePicture: Loading image for user:', user.name || 'Unknown', 'URL:', user.picture)
      setImageError(false)
      setIsLoading(true)
      setRetryCount(0) // Reset retry count when picture changes
    }
  }, [user.picture, user.name])

  const handleImageLoad = () => {
    console.log('ProfilePicture: Image loaded successfully for user:', user.name || 'Unknown')
    setIsLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    console.log('ProfilePicture: Image failed to load for user:', user.name || 'Unknown', 'URL:', user.picture, 'Retry count:', retryCount)
    
    if (retryCount < 2 && user.picture) {
      // Retry with a different URL format
      setRetryCount(prev => prev + 1)
      setIsLoading(true)
      setImageError(false)
      
      // Try different URL formats
      const originalUrl = user.picture
      let retryUrl = originalUrl
      
      if (retryCount === 0) {
        // Try adding size parameter
        retryUrl = originalUrl.includes('?') 
          ? `${originalUrl}&sz=200` 
          : `${originalUrl}?sz=200`
      } else if (retryCount === 1) {
        // Try removing size parameter if it exists
        retryUrl = originalUrl.split('?')[0]
      }
      
      console.log('ProfilePicture: Retrying with URL:', retryUrl)
      
      // Force reload by updating the src
      setTimeout(() => {
        const img = document.querySelector(`img[alt="${user.name || 'Unknown'}'s profile"]`) as HTMLImageElement
        if (img && retryUrl) {
          img.src = retryUrl
        }
      }, 100)
    } else {
      setImageError(true)
      setIsLoading(false)
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getImageUrl = () => {
    if (!user.picture) return null
    
    if (retryCount === 0) {
      return user.picture
    } else if (retryCount === 1) {
      // Try adding size parameter
      return user.picture.includes('?') 
        ? `${user.picture}&sz=200` 
        : `${user.picture}?sz=200`
    } else if (retryCount === 2) {
      // Try removing size parameter if it exists
      return user.picture.split('?')[0]
    }
    
    return user.picture
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white/30 ${className}`}>
      {user.picture && !imageError ? (
        <img
          src={getImageUrl() || user.picture}
          alt={`${user.name || 'Unknown'}'s profile`}
          className="w-full h-full object-cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: isLoading ? 'none' : 'block' }}
        />
      ) : null}
      
      {/* Fallback with initials */}
      <div 
        className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-red-500 ${
          user.picture && !imageError ? 'hidden' : 'flex'
        }`}
      >
        <span className="text-white font-semibold text-xs">
          {getInitials(user.name)}
        </span>
      </div>
      
      {/* Loading indicator */}
      {isLoading && user.picture && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}