import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginInput,
  LoginSchema,
  RegisterInput,
  RegisterSchema,
} from './auth.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: unknown) {
    const parsed: RegisterInput = RegisterSchema.parse(body);
    return this.authService.register(parsed);
  }

  @Post('login')
  login(@Body() body: unknown) {
    const parsed: LoginInput = LoginSchema.parse(body);
    return this.authService.login(parsed);
  }

  @Post('refresh-token')
  async refresh(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
    return this.authService.refreshAccessToken(refreshToken);
  }
}
