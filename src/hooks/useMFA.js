import { supabase } from '../lib/supabase';

export function useMFA() {
  const getMFAStatus = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) throw error;
    const totpFactor = data.totp.find(f => f.status === 'verified');
    return {
      enabled: !!totpFactor,
      factorId: totpFactor ? totpFactor.id : null
    };
  };

  const enrollMFA = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) throw error;
    return {
      totp: data.totp,
      id: data.id
    };
  };

  const verifyEnrollment = async (factorId, code) => {
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code
    });
    if (error) throw error;
    return data;
  };

  const unenrollMFA = async (factorId) => {
    const { data, error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw error;
    return data;
  };

  const verifyMFA = async (factorId, code) => {
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code
    });
    if (error) throw error;
    return data;
  };

  const getAAL = async () => {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) throw error;
    return data;
  };

  return {
    getMFAStatus,
    enrollMFA,
    verifyEnrollment,
    unenrollMFA,
    verifyMFA,
    getAAL
  };
}
