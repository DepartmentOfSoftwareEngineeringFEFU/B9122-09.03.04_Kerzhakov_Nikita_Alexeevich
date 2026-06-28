export interface AuthDto {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterPayload {
  login: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Пустая строка, если не заполнено */
  patronymic?: string;
}
