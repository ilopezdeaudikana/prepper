import { getSupabaseClient } from './supabase'
import { createSessionToken, resolveSessionIdFromToken } from './utils'

import * as bip39 from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import { Tables } from './types'

/*
 * Returns a secure 12-word standard recovery phrase.
 */
export const createSecurePhrase = () => {

  const mnemonic = bip39.generateMnemonic(wordlist, 128)

  return mnemonic
}

/**
 * Checks if the user's typed phrase is a valid BIP-39 phrase.
 */
export const checkUserPhrase = (userTypedPhrase: string): boolean => {
  const cleanInput = userTypedPhrase.trim().toLowerCase()

  return bip39.validateMnemonic(cleanInput, wordlist)
}

export const upsertUser = async (user: string)
  : Promise<{ id: string | null, recoveryPhrase?: string }> => {

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from(Tables.Users)
    .upsert({ username: user })
    .select('id')
    .single<{ id: string, recovery_phrase: string }>()

  if (error) throw new Error(`Failed to persist user: ${error.message}`)

  return {
    id: createSessionToken(process.env.HASH_SECRET!, data.id),
    recoveryPhrase: data.recovery_phrase
  }
}

export const findUser = async (user: string)
  : Promise<{ id: string | null, recoveryPhrase?: string }> => {

  const supabase = getSupabaseClient()
  
  const userId = resolveSessionIdFromToken(process.env.HASH_SECRET!, user)

  const { data, error } = await supabase
    .from(Tables.Users)
    .select('id, recovery_phrase')
    .eq('id', userId )
    .single<{ id: string, recovery_phrase: string }>()

  if (error) throw new Error(`Could not find user: ${error.message}`)

  return {
    id: createSessionToken(process.env.HASH_SECRET!, data?.id),
    recoveryPhrase: data.recovery_phrase
  }
}

export const generateRecoveryPhrase = async (user: string)
  : Promise<{ id: string | null, recoveryPhrase: string }> => {

  const phrase = createSecurePhrase()

  const supabase = getSupabaseClient()

  const userId = resolveSessionIdFromToken(process.env.HASH_SECRET!, user)

  const { data, error } = await supabase
    .from(Tables.Users)
    .update({'recovery_phrase': phrase })
    .select('id')
    .eq('id', userId)
    .single<{ id: string }>()

  if (error) throw new Error(`Failed to generate recovery phrase: ${error.message}`)

  return {
    id: createSessionToken(process.env.HASH_SECRET!, data?.id ?? ''),
    recoveryPhrase: phrase
  }
}

export const findByPhrase = async (recoveryPhrase: string)
  : Promise<{ id: string | null, recoveryPhrase?: string }> => {

  const isValid = checkUserPhrase(recoveryPhrase)
  if (!isValid) throw new Error('Invalid recovery phrase')
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from(Tables.Users)
    .select('id')
    .eq('recovery_phrase', recoveryPhrase)
    .single<{ id: string, recovery_phrase: string }>()

  if (error) throw new Error(`Find user by phrase failed: ${error.message}`)

  return {
    id: createSessionToken(process.env.HASH_SECRET!, data.id)
  }
}
