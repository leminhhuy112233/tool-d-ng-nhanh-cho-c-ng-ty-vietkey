/**
 * VietKey DocGen — usePartnerSuggestions Hook
 * Quản lý danh sách đối tác đã lưu, gợi ý tự động khi người dùng gõ tên hoặc MST
 */

import { useState, useEffect, useCallback } from 'react'
import type { PartnerProfile } from '../../../shared/types'

export function usePartnerSuggestions() {
  const [savedPartners, setSavedPartners] = useState<PartnerProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const reloadPartners = useCallback(async () => {
    if (window.api?.getPartners) {
      setIsLoading(true)
      try {
        const list = await window.api.getPartners()
        setSavedPartners(list || [])
      } catch (err) {
        console.error('Lỗi nạp danh sách đối tác:', err)
      } finally {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    reloadPartners()
  }, [reloadPartners])

  const savePartner = useCallback(
    async (profile: Omit<PartnerProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!profile.ten_cong_ty?.trim() || !window.api?.savePartner) return null
      try {
        const saved = await window.api.savePartner(profile)
        await reloadPartners()
        return saved
      } catch (err) {
        console.error('Lỗi lưu đối tác:', err)
        return null
      }
    },
    [reloadPartners]
  )

  const filterPartners = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase()
      if (!q) return savedPartners
      return savedPartners.filter(
        (p) =>
          p.ten_cong_ty.toLowerCase().includes(q) ||
          (p.mst && p.mst.toLowerCase().includes(q)) ||
          (p.dai_dien && p.dai_dien.toLowerCase().includes(q))
      )
    },
    [savedPartners]
  )

  return {
    savedPartners,
    isLoading,
    savePartner,
    filterPartners,
    reloadPartners
  }
}
