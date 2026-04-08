export interface JwtPayload {
  sub: string; //subject, the owner of token, in our case the user id
  email: string;
  role: 'Administrator' | 'User';
}