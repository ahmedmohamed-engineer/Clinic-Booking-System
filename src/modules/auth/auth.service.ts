import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import ms from "ms";
import { authRepository } from "./auth.repository.js";
import { jwt as jwtConfig } from "../../config/index.js";
import { hashPassword, comparePassword } from "../../shared/utils/password.js";
import { AppError } from "../../shared/errors/app-error.js";
import { HttpStatus } from "../../shared/constants/http-status.js";
import type { RegisterDto, LoginDto, AuthTokens } from "./auth.types.js";
import type { UserPublic } from "../../shared/types/user.types.js";
import type { UUID } from "../../shared/types/common.types.js";

function generateTokens(userId: UUID, role: string): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign(
    { sub: userId, role },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn },
  );

  const refreshToken = jwt.sign(
    { sub: userId, jti: crypto.randomUUID() },
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshExpiresIn },
  );

  return { accessToken, refreshToken };
}

async function persistRefreshToken(userId: UUID, refreshToken: string): Promise<void> {
  const tokenHash = authRepository.hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + ms(jwtConfig.refreshExpiresIn));
  await authRepository.saveRefreshToken(userId, tokenHash, expiresAt);
}

export class AuthService {
  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await authRepository.findByEmail(dto.email);

    if (existing) {
      throw new AppError(HttpStatus.CONFLICT, "Email already exists");
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await authRepository.transaction(async () => {
      const u = await authRepository.create({
        email: dto.email,
        passwordHash,
        role: "patient",
        fullName: dto.fullName,
      });

      await authRepository.createPatient(u.id, dto.fullName);

      return u;
    });

    const tokens = generateTokens(user.id, user.role);
    await persistRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await authRepository.findByEmail(dto.email);

    if (!user) {
      throw new AppError(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    const passwordValid = await comparePassword(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new AppError(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    const tokens = generateTokens(user.id, user.role);
    await persistRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async refreshToken(refreshTokenStr: string): Promise<AuthTokens> {
    let payload: { sub: string };
    try {
      payload = jwt.verify(refreshTokenStr, jwtConfig.refreshSecret) as { sub: string };
    } catch {
      throw new AppError(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
    }

    const tokenHash = authRepository.hashToken(refreshTokenStr);

    const storedToken = await authRepository.findRefreshToken(tokenHash);
    if (!storedToken) {
      throw new AppError(HttpStatus.UNAUTHORIZED, "Refresh token not found or expired");
    }

    const user = await authRepository.findById(payload.sub);
    if (!user) {
      throw new AppError(HttpStatus.UNAUTHORIZED, "User not found");
    }

    await authRepository.revokeRefreshToken(tokenHash);

    const tokens = generateTokens(user.id, user.role);
    await persistRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(refreshTokenStr: string): Promise<void> {
    const tokenHash = authRepository.hashToken(refreshTokenStr);
    await authRepository.revokeRefreshToken(tokenHash);
  }

  async me(userId: UUID): Promise<UserPublic> {
    const user = await authRepository.findById(userId);

    if (!user) {
      throw AppError.notFound("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }
}

export const authService = new AuthService();
