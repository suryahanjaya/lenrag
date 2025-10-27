'use client'

import { useState, useEffect, useMemo, memo } from 'react'

interface ProfilePictureProps {
  user: {
    id: string
    name?: string
    picture?: string
  } | null
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const ProfilePicture = memo(function ProfilePicture({ user, className = '', size = 'md' }: ProfilePictureProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Memoize user data to prevent unnecessary re-renders
  const memoizedUser = useMemo(() => user ? {
    id: user.id,
    name: user.name,
    picture: user.picture
  } : null, [user?.id, user?.name, user?.picture])

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

useEffect(() => {
  if (memoizedUser?.picture) {
    setImageError(false)
    setIsLoading(true)
  } else {
    setImageError(true)
    setIsLoading(false)
  }
}, [memoizedUser?.picture, memoizedUser?.name])


  const handleImageLoad = () => {
    setIsLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setIsLoading(false)
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

  // Early return if no user
  if (!memoizedUser) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white/30 ${className}`}>
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600">
          <span className="text-white font-semibold text-xs">U</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white/30 ${className}`}>
      {memoizedUser.picture && !imageError ? (
        <img
          src={memoizedUser.picture}
          alt={`${memoizedUser.name || 'Unknown'}'s profile`}
          className="w-full h-full object-cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: isLoading ? 'none' : 'block' }}
        />
      ) : null}
      
      {/* Fallback with initials */}
      <div 
        className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-red-500 ${
          memoizedUser.picture && !imageError ? 'hidden' : 'flex'
        }`}
      >
        <span className="text-white font-semibold text-xs">
          {getInitials(memoizedUser.name)}
        </span>
      </div>
      
      {/* Loading indicator */}
      {isLoading && memoizedUser.picture && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
});

export { ProfilePicture };