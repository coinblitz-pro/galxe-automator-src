import si from 'systeminformation'
import axios from 'axios'
import { LICENSE } from './persist'

let access: { status: boolean, message?: string } = { status: null }

export async function checkAccess(key?: string) {
  if (access.status !== null) {
    return access
  }

  const { uuid } = await si.system()
  const response = await axios.post(
    `https://license-server-production.up.railway.app/auth`,
    { app_name: 'galxe-automator', key: key ?? LICENSE, user_info: uuid },
    { validateStatus: () => true },
  )

  switch (response.status) {
    case 200:
      return access = { status: true }
    case 400:
      return access = { status: false, message: 'Неверный запрос' }
    case 401:
      return access = { status: false, message: 'Неверный ключ' }
    case 403:
      return access = { status: false, message: 'Привязка нового устройства невозможна' }
    case 500:
      return access = { status: false, message: 'Ошибка сервера' }
    default:
      return access = { status: false, message: 'Что-то пошло не так' }
  }
}

export function resetAccess() {
  access = { status: null }
}
