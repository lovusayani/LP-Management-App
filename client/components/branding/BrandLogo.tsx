"use client";

import { useEffect, useState } from "react";

import { BrandingAssets, BrandingLogoVariant, getBrandingAssets } from "@/services/branding.service";
import { getPublicAssetUrl } from "@/services/api";

const variantToField: Record<BrandingLogoVariant, keyof BrandingAssets> = {
    dark: "darkLogoPath",
    light: "lightLogoPath",
    mobile: "mobileLogoPath",
};

export function BrandLogo({
    variant,
    fallbackText,
    className = "",
    wrapperClassName = "",
}: {
    variant: BrandingLogoVariant;
    fallbackText: string;
    className?: string;
    wrapperClassName?: string;
}) {
    const [branding, setBranding] = useState<BrandingAssets | null>(null);

    useEffect(() => {
        let disposed = false;

        const load = async () => {
            try {
                const data = await getBrandingAssets();
                if (!disposed) {
                    setBranding(data);
                }
            } catch {
                if (!disposed) {
                    setBranding(null);
                }
            }
        };

        load();

        const onUpdate = () => load();
        window.addEventListener("branding-updated", onUpdate);
        return () => {
            disposed = true;
            window.removeEventListener("branding-updated", onUpdate);
        };
    }, []);

    const assetPath = branding?.[variantToField[variant]] || "";

    if (!assetPath) {
        return <span className={wrapperClassName}>{fallbackText}</span>;
    }

    return (
        <div className={wrapperClassName}>
            <img src={getPublicAssetUrl(assetPath)} alt={fallbackText} className={className} />
        </div>
    );
}