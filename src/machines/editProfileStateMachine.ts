// src/machines/editProfileStateMachine.ts
import { useReducer } from 'react';

export interface ProfileData {
  fname: string;
  lname: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  state: string;
}

export type EditProfileState =
  | { type: 'idle'; data: ProfileData }
  | { type: 'loading'; data: ProfileData }
  | { type: 'saving'; data: ProfileData }
  | { type: 'error'; error: string; data: ProfileData }
  | { type: 'success'; message: string; data: ProfileData };

export type EditProfileEvent =
  | { type: 'UPDATE_FIELD'; field: keyof ProfileData; value: string }
  | { type: 'UPDATE_ALL_FIELDS'; data: ProfileData }
  | { type: 'START_LOADING' }
  | { type: 'START_SAVING' }
  | { type: 'SAVE_SUCCESS'; message: string }
  | { type: 'SAVE_ERROR'; error: string }
  | { type: 'RESET_TO_IDLE' };

const editProfileStateMachine = (
  state: EditProfileState,
  event: EditProfileEvent
): EditProfileState => {
  switch (state.type) {
    case 'idle':
      if (event.type === 'UPDATE_FIELD') {
        return {
          ...state,
          data: { ...state.data, [event.field]: event.value },
        };
      }
      if (event.type === 'UPDATE_ALL_FIELDS') {
        return { ...state, data: event.data };
      }
      if (event.type === 'START_LOADING') {
        return { type: 'loading', data: state.data };
      }
      if (event.type === 'START_SAVING') {
        return { type: 'saving', data: state.data };
      }
      return state;

    case 'loading':
      if (event.type === 'UPDATE_ALL_FIELDS') {
        return { type: 'idle', data: event.data };
      }
      if (event.type === 'SAVE_ERROR') {
        return { type: 'error', error: event.error, data: state.data };
      }
      return state;

    case 'saving':
      if (event.type === 'SAVE_SUCCESS') {
        return { type: 'success', message: event.message, data: state.data };
      }
      if (event.type === 'SAVE_ERROR') {
        return { type: 'error', error: event.error, data: state.data };
      }
      return state;

    case 'error':
      if (event.type === 'UPDATE_FIELD') {
        return {
          type: 'idle',
          data: { ...state.data, [event.field]: event.value },
        };
      }
      if (event.type === 'START_SAVING') {
        return { type: 'saving', data: state.data };
      }
      if (event.type === 'RESET_TO_IDLE') {
        return { type: 'idle', data: state.data };
      }
      return state;

    case 'success':
      if (event.type === 'UPDATE_FIELD') {
        return {
          type: 'idle',
          data: { ...state.data, [event.field]: event.value },
        };
      }
      if (event.type === 'RESET_TO_IDLE') {
        return { type: 'idle', data: state.data };
      }
      return state;

    default:
      return state;
  }
};

export const useEditProfileStateMachine = (initialData: ProfileData) => {
  const [state, dispatch] = useReducer(editProfileStateMachine, {
    type: 'idle',
    data: initialData,
  });

  return { state, dispatch };
};
