import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SESSION_VALIDITY_MS, LOGOUT_REASONS } from '@/config/constants'
import { commsAPI } from '@/services/comms-api'
import type { CommsAppInfo } from '@/types/api'

type LogoutReason = (typeof LOGOUT_REASONS)[keyof typeof LOGOUT_REASONS]

interface AuthState {
  isAuthenticated: boolean
  isSessionChecked: boolean
  isLoggingOut: boolean
  loginTimestamp: number | null
  user: {
    teamMemberID: string
    name: string
    email?: string
    organizationID?: string
    primaryTeam?: string
  } | null
  commsInfo: CommsAppInfo | null

  generateOTP: (email: string) => Promise<void>
  loginWithOTP: (email: string, code: string) => Promise<void>
  getSSOAuthorizeUrl: (params: {
    provider: string
    state: string
    redirectUri: string
    email?: string
    domain?: string
  }) => Promise<string>
  completeSSOLogin: (code: string, state: string, redirectUri: string) => Promise<void>
  logout: (reason?: LogoutReason) => Promise<void>
  checkSession: () => Promise<void>
  checkSessionValidity: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isSessionChecked: false,
      isLoggingOut: false,
      loginTimestamp: null,
      user: null,
      commsInfo: null,

      generateOTP: async (email) => {
        await commsAPI.generateOTP(email)
      },

      loginWithOTP: async (email, code) => {
        await commsAPI.loginWithOTP(email, code)
        const info = await commsAPI.getCommsAppInfo()
        set({
          isAuthenticated: true,
          isSessionChecked: true,
          loginTimestamp: Date.now(),
          commsInfo: info,
          user: {
            teamMemberID: info.teamMemberID,
            name: info.name,
            email: email,
            organizationID: info.organizationID,
            primaryTeam: info.primaryTeam,
          },
        })
      },

      getSSOAuthorizeUrl: async (params) => {
        return commsAPI.getSSOAuthorizeUrl(params)
      },

      completeSSOLogin: async (code, state, redirectUri) => {
        const ssoResponse = await commsAPI.completeSSOLogin({ code, state, redirectUri })
        const info = await commsAPI.getCommsAppInfo()
        set({
          isAuthenticated: true,
          isSessionChecked: true,
          loginTimestamp: Date.now(),
          commsInfo: info,
          user: {
            teamMemberID: info.teamMemberID,
            name: info.name,
            email: (ssoResponse.email?.trim() || info.email?.trim()) || undefined,
            organizationID: info.organizationID,
            primaryTeam: info.primaryTeam,
          },
        })
      },

      logout: async (reason = LOGOUT_REASONS.MANUAL) => {
        const state = get()
        if (state.isLoggingOut) return
        set({ isLoggingOut: true })
        try {
          await commsAPI.logout()
        } catch {
          // best-effort logout
        }
        set({
          isAuthenticated: false,
          isSessionChecked: true,
          isLoggingOut: false,
          loginTimestamp: null,
          user: null,
          commsInfo: null,
        })
        if (reason) { /* consumed */ }
      },

      checkSession: async () => {
        const state = get()
        if (state.isAuthenticated && !state.checkSessionValidity()) {
          await state.logout(LOGOUT_REASONS.SESSION_EXPIRED)
          return
        }
        try {
          const info = await commsAPI.getCommsAppInfo()
          const existingTimestamp = state.isAuthenticated && state.loginTimestamp
            ? state.loginTimestamp
            : Date.now()
          set({
            isAuthenticated: true,
            isSessionChecked: true,
            loginTimestamp: existingTimestamp,
            commsInfo: info,
            user: {
              teamMemberID: info.teamMemberID,
              name: info.name,
              email: (info.email?.trim() || state.user?.email?.trim()) || undefined,
              organizationID: info.organizationID,
              primaryTeam: info.primaryTeam,
            },
          })
        } catch (error) {
          const isUnauth =
            error instanceof Error &&
            'response' in error &&
            (error as Error & { response?: { status: number } }).response?.status === 401
          if (isUnauth) {
            if (state.isAuthenticated) {
              await get().logout(LOGOUT_REASONS.SESSION_EXPIRED)
            } else {
              set({ isAuthenticated: false, isSessionChecked: true, user: null, commsInfo: null })
            }
          }
        }
      },

      checkSessionValidity: () => {
        const state = get()
        if (!state.isAuthenticated || !state.loginTimestamp) return false
        return Date.now() - state.loginTimestamp < SESSION_VALIDITY_MS
      },
    }),
    {
      name: 'comms-demo-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        loginTimestamp: state.loginTimestamp,
        user: state.user,
        commsInfo: state.commsInfo,
      }),
    }
  )
)
