// src/machines/authFormMachine.ts
import { useReducer } from 'react';

export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
  fname?: string;
  lname?: string;
}

export type AuthFormState =
  | { type: 'idle'; form: AuthFormData }
  | { type: 'validating'; form: AuthFormData }
  | { type: 'submitting'; form: AuthFormData; method: 'credentials' | 'google' }
  | { type: 'error'; form: AuthFormData; error: string }
  | { type: 'success'; form: AuthFormData };

export type AuthFormEvent =
  | { type: 'UPDATE_FIELD'; field: keyof AuthFormData; value: string }
  | { type: 'SUBMIT_CREDENTIALS' }
  | { type: 'SUBMIT_GOOGLE' }
  | { type: 'VALIDATE_SUCCESS' }
  | { type: 'VALIDATE_ERROR'; error: string }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'RESET' };

const authFormMachine = (state: AuthFormState, event: AuthFormEvent): AuthFormState => {
  switch (state.type) {
    case 'idle':
      if (event.type === 'UPDATE_FIELD') {
        return {
          ...state,
          form: { ...state.form, [event.field]: event.value },
        };
      }
      if (event.type === 'SUBMIT_CREDENTIALS') {
        return { type: 'validating', form: state.form };
      }
      if (event.type === 'SUBMIT_GOOGLE') {
        return { type: 'submitting', form: state.form, method: 'google' };
      }
      return state;

    case 'validating':
      if (event.type === 'VALIDATE_SUCCESS') {
        return { type: 'submitting', form: state.form, method: 'credentials' };
      }
      if (event.type === 'VALIDATE_ERROR') {
        return { type: 'error', form: state.form, error: event.error };
      }
      return state;

    case 'submitting':
      if (event.type === 'SUBMIT_SUCCESS') {
        return { type: 'success', form: state.form };
      }
      if (event.type === 'SUBMIT_ERROR') {
        return { type: 'error', form: state.form, error: event.error };
      }
      return state;

    case 'error':
      if (event.type === 'RESET') {
        return { type: 'idle', form: state.form };
      }
      if (event.type === 'UPDATE_FIELD') {
        return {
          type: 'idle',
          form: { ...state.form, [event.field]: event.value },
        };
      }
      if (event.type === 'SUBMIT_CREDENTIALS') {
        return { type: 'validating', form: state.form };
      }
      if (event.type === 'SUBMIT_GOOGLE') {
        return { type: 'submitting', form: state.form, method: 'google' };
      }
      return state;

    case 'success':
      if (event.type === 'RESET') {
        return {
          type: 'idle',
          form: { email: '', password: '' },
        };
      }
      return state;

    default:
      return state;
  }
};

export const useAuthFormMachine = (mode: 'login' | 'signup' | 'forgot-password') => {
  const initialForm: AuthFormData = 
    mode === 'signup'
      ? { email: '', password: '', confirmPassword: '', fname: '', lname: '' }
      : mode === 'forgot-password'
      ? { email: '', password: '' } // password not used but keeps type consistent
      : { email: '', password: '' };

  const [state, dispatch] = useReducer(authFormMachine, {
    type: 'idle',
    form: initialForm,
  });

  return { state, dispatch };
};