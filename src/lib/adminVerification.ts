type Verification = { email:string; token:string; type:'email' } | { token_hash:string; type:'email'|'magiclink'|'signup' }

// Verify an email's token directly. Never navigate to a pasted link or follow its redirect.
export function adminVerification(value: string, email: string, projectUrl: string): Verification {
  const input = value.trim().replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
  if (/^\d{6,10}$/.test(input)) return { email, token:input, type:'email' }
  try {
    const link = new URL(input)
    if (link.origin !== new URL(projectUrl).origin || link.pathname !== '/auth/v1/verify') throw new Error()
    const type = link.searchParams.get('type')
    const token = link.searchParams.get('token_hash') || link.searchParams.get('token')
    if (!token || !['email','magiclink','signup'].includes(type || '')) throw new Error()
    return { token_hash:token, type:type as 'email'|'magiclink'|'signup' }
  } catch { throw new Error('کد ورود یا پیوند اصلی ایمیل را وارد کنید.') }
}
