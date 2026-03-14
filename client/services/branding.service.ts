import { apiFetch } from "./api";

export type BrandingLogoVariant = "dark" | "light" | "mobile";

export interface BrandingAssets {
  darkLogoPath: string;
  lightLogoPath: string;
  mobileLogoPath: string;
}

export const getBrandingAssets = async (): Promise<BrandingAssets> => {
  const data = await apiFetch<{ branding: BrandingAssets }>("/branding/logos", {
    method: "GET",
    auth: false,
  });

  return data.branding;
};

export const uploadAdminBrandingLogo = async (
  variant: BrandingLogoVariant,
  file: File
): Promise<BrandingAssets> => {
  const formData = new FormData();
  formData.append("logo", file);

  const data = await apiFetch<{ branding: BrandingAssets }>(`/admin/setup/logos/${variant}`, {
    method: "POST",
    formData,
  });

  return data.branding;
};