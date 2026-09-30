import { NotificationStackPosition } from '../types';

export const getNotificationStackPositionClasses = (position: NotificationStackPosition): string => {
  if (position === 'top-left') {
    return 'top-12 left-8 flex-col items-start';
  } else if (position === 'top-right') {
    return 'top-12 right-8 flex-col items-end';
  } else if (position === 'bottom-left') {
    return 'bottom-[96px] left-8 flex-col-reverse items-start';
  } else if (position === 'bottom-center') {
    return 'bottom-[96px] left-1/2 -translate-x-1/2 flex-col-reverse items-center';
  } else if (position === 'bottom-right') {
    return 'bottom-[96px] right-8 flex-col-reverse items-end';
  }
  return 'top-12 left-1/2 -translate-x-1/2 flex-col items-center';
};
