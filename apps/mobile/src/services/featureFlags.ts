import { api } from "./api";
import type { RuntimeFeatureFlags } from "../constants/featureFlags";

export type RuntimeFeatureFlagsResponse = RuntimeFeatureFlags & {
  generatedAt?: string;
};

export async function getRuntimeFeatureFlags(): Promise<RuntimeFeatureFlagsResponse> {
  const { data } = await api.get<RuntimeFeatureFlagsResponse>("/auth/feature-flags");
  return data;
}
