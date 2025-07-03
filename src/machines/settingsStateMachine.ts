import { useReducer } from 'react';

export interface SettingsData {
  notifications: {
    email: boolean;
    push: boolean;
  };
  profile?: {
    fname: string;
    lname: string;
    phone: string;
    country: string;
    city: string;
    state: string;
  };
}

export type SettingsState =
  | { type: 'idle'; data: SettingsData }
  | {
      type: 'saving';
      operation: 'theme' | 'language' | 'notifications' | 'profile' | 'logout';
      data: SettingsData;
    }
  | { type: 'error'; error: string; context?: string; data: SettingsData }
  | { type: 'success'; message: string; operation: string; data: SettingsData };

export type SettingsEvent =
  | { type: 'UPDATE_NOTIFICATIONS'; notifications: { email: boolean; push: boolean } }
  | { type: 'UPDATE_PROFILE'; profile: SettingsData['profile'] }
  | { type: 'START_THEME_CHANGE' }
  | { type: 'START_LANGUAGE_CHANGE' }
  | { type: 'START_PROFILE_SAVE' }
  | { type: 'START_LOGOUT' }
  | { type: 'OPERATION_SUCCESS'; message: string; operation: string }
  | { type: 'OPERATION_ERROR'; error: string; context?: string }
  | { type: 'RESET_TO_IDLE' };

const settingsStateMachine = (state: SettingsState, event: SettingsEvent): SettingsState => {
  switch (state.type) {
    case 'idle':
      if (event.type === 'UPDATE_NOTIFICATIONS') {
        return {
          ...state,
          data: { ...state.data, notifications: event.notifications },
        };
      }
      if (event.type === 'UPDATE_PROFILE') {
        return {
          ...state,
          data: { ...state.data, profile: event.profile },
        };
      }
      if (event.type === 'START_THEME_CHANGE') {
        return { type: 'saving', operation: 'theme', data: state.data };
      }
      if (event.type === 'START_LANGUAGE_CHANGE') {
        return { type: 'saving', operation: 'language', data: state.data };
      }
      if (event.type === 'START_PROFILE_SAVE') {
        return { type: 'saving', operation: 'profile', data: state.data };
      }
      if (event.type === 'START_LOGOUT') {
        return { type: 'saving', operation: 'logout', data: state.data };
      }
      return state;
    case 'saving':
      if (event.type === 'OPERATION_SUCCESS') {
        return {
          type: 'success',
          message: event.message,
          operation: event.operation,
          data: state.data,
        };
      }
      if (event.type === 'OPERATION_ERROR') {
        return {
          type: 'error',
          error: event.error,
          context: event.context,
          data: state.data,
        };
      }
      return state;

    case 'error':
      if (event.type === 'RESET_TO_IDLE') {
        return { type: 'idle', data: state.data };
      }
      // Allow starting new operations from error state
      if (event.type === 'START_THEME_CHANGE') {
        return { type: 'saving', operation: 'theme', data: state.data };
      }
      if (event.type === 'START_LANGUAGE_CHANGE') {
        return { type: 'saving', operation: 'language', data: state.data };
      }
      if (event.type === 'START_PROFILE_SAVE') {
        return { type: 'saving', operation: 'profile', data: state.data };
      }
      return state;

    case 'success':
      if (event.type === 'RESET_TO_IDLE') {
        return { type: 'idle', data: state.data };
      }
      // Auto-transition to idle after success (could add timeout)
      return { type: 'idle', data: state.data };

    default:
      return state;
  }
};

export const useSettingsStateMachine = (initialNotifications = { email: true, push: false }) => {
  const [state, dispatch] = useReducer(settingsStateMachine, {
    type: 'idle',
    data: {
      notifications: initialNotifications,
    },
  });

  return { state, dispatch };
};
