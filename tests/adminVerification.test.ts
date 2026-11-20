import { expect,it } from 'vitest'
import { adminVerification } from '../src/lib/adminVerification'
const project = 'https://example-project.supabase.co'
it('accepts an emailed code including Persian and Arabic numerals', () => {
  expect(adminVerification(' ۱۲۳۴۵۶ ', 'owner@example.com',project)).toEqual({email:'owner@example.com',token:'123456',type:'email'})
  expect(adminVerification('١٢٣٤٥٦٧٨','owner@example.com',project).type).toBe('email')
})
it('verifies the original project email link without following its redirect', () => {
  expect(adminVerification(`${project}/auth/v1/verify?token=secret-hash&type=signup&redirect_to=http://localhost:3000`, 'owner@example.com',project)).toEqual({token_hash:'secret-hash',type:'signup'})
  expect(adminVerification(`${project}/auth/v1/verify?token_hash=secret-hash&type=magiclink`,'owner@example.com',project)).toEqual({token_hash:'secret-hash',type:'magiclink'})
})
it('rejects other projects, arbitrary destinations, recovery links and missing tokens', () => {
  for(const link of ['https://attacker.example/auth/v1/verify?token=x&type=email',`${project}/other?token=x&type=email`,`${project}/auth/v1/verify?token=x&type=recovery`,`${project}/auth/v1/verify?type=email`]) expect(()=>adminVerification(link,'owner@example.com',project)).toThrow()
})
