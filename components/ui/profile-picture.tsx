'use client'

import { useState, useEffect, useMemo, memo } from 'react'

interface ProfilePictureProps {
  user: {
    id: string
    name?: string
    picture?: string
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const ProfilePicture = memo(function ProfilePicture({ user, className = '', size = 'md' }: ProfilePictureProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Memoize user data to prevent unnecessary re-renders
  const memoizedUser = useMemo(() => ({
    id: user?.id,
    name: user?.name,
    picture: user?.picture
  }), [user?.id, user?.name, user?.picture])

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

  useEffect(() => {
    console.log('ProfilePicture: useEffect triggered, user:', memoizedUser.name, 'picture:', memoizedUser.picture)
    
    if (memoizedUser.picture) {
      console.log('ProfilePicture: Loading image for user:', memoizedUser.name || 'Unknown', 'URL:', memoizedUser.picture)
      setImageError(false)
      setIsLoading(true)
    } else {
      console.log('ProfilePicture: No picture available for user:', memoizedUser.name || 'Unknown')
      setImageError(true)
      setIsLoading(false)
    }
  }, [memoizedUser.picture, memoizedUser.name])

  const handleImageLoad = () => {
    console.log('ProfilePicture: Image loaded successfully for user:', memoizedUser.name || 'Unknown')
    setIsLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    console.log('ProfilePicture: Image failed to load for user:', memoizedUser.name || 'Unknown', 'URL:', memoizedUser.picture)
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