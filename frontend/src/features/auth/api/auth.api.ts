import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { AuthTokens } from "@/types/auth";
import type { UserRecord } from "@/types/models/user";
import type { RegisterInput, LoginInput, RefreshTokenInput, LogoutInput } from "@/schemas/auth";

export async function registerUser(data: RegisterInput): Promise<AuthTokens> {
  const response = await api.post<ApiResponse<AuthTokens>>("/auth/register", data);
  return response.data.data;
}

export async function loginUser(data: LoginInput): Promise<AuthTokens> {
  const response = await api.post<ApiResponse<AuthTokens>>("/auth/login", data);
  return response.data.data;
}

export async function refreshUserTokens(data: RefreshTokenInput): Promise<AuthTokens> {
  const response = await api.post<ApiResponse<AuthTokens>>("/auth/refresh", data);
  return response.data.data;
}

export async function logoutUser(data: LogoutInput): Promise<void> {
  await api.post("/auth/logout", data);
}

export async function getCurrentUser(): Promise<UserRecord> {
  const response = await api.get<ApiResponse<UserRecord>>("/auth/me");
  return response.data.data;
}

export async function uploadAvatar(file: File): Promise<UserRecord> {
  const formData = new FormData();
  formData.append("avatar", file);
  const response = await api.post<ApiResponse<UserRecord>>("/users/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
}
