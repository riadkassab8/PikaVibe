import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const alertBox = Swal.mixin({
  reverseButtons: true,
  confirmButtonColor: '#C8722E',
  cancelButtonColor: '#6B7280',
  buttonsStyling: true,
  customClass: {
    popup: 'rounded-3xl',
    confirmButton: 'rounded-xl px-5 py-3 font-bold',
    cancelButton: 'rounded-xl px-5 py-3 font-bold',
  },
  didOpen: (popup) => popup.setAttribute('dir', 'rtl'),
});

export async function confirmAction(title: string, text: string) {
  return alertBox.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'نعم، متابعة',
    cancelButtonText: 'إلغاء',
    focusCancel: true,
  });
}

export function notifySuccess(title: string, text?: string) {
  return alertBox.fire({ title, text, icon: 'success', confirmButtonText: 'حسنًا' });
}

export function notifyInfo(title: string, text?: string) {
  return alertBox.fire({ title, text, icon: 'info', confirmButtonText: 'حسنًا' });
}

export function notifyError(title: string, text?: string) {
  return alertBox.fire({ title, text, icon: 'error', confirmButtonText: 'حسنًا' });
}

export function showLoading(title = 'جارٍ التنفيذ…') {
  alertBox.fire({ title, allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });
}

export function closeAlert() {
  Swal.close();
}
