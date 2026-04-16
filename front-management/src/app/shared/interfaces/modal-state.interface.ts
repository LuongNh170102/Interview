import { ModalType } from '../types/modal-type.type';

export interface ModalState {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: string;
  onConfirm?: () => void;
  // extends for input functionality
  inputValue?: string;
  isInput?: boolean;
  onSubmitInput?: (value: string) => void;
}
