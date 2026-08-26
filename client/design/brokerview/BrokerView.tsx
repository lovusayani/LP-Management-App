"use client";

import { Flame, Lightbulb, Music2, ShieldCheck, Sun, Volume2, Wind } from "lucide-react";

import { BrokerPageFrame } from "@/design/components/BrokerPageFrame";
import { GlossyCard } from "@/design/components/GlossyCard";
import { RadialGauge } from "@/design/components/RadialGauge";
import { SliderRow } from "@/design/components/SliderRow";

export function BrokerView() {
    return (
        <BrokerPageFrame title="Dashboard">
            <GlossyCard
                accent="amber"
                icon={Flame}
                title="Smart Thermostat"
                subtitle=""
                className="p-5"
            >
                <div className="mb-3 -mt-1 flex items-center justify-between">
                    <span className="rounded-full bg-orange-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange-300">
                        Climate Core
                    </span>
                    <span className="rounded-full bg-amber-400/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                        Heating
                    </span>
                </div>

                <div className="flex items-center gap-5">
                    <RadialGauge value="72" unit="°" label="Set Point" percent={72} />

                    <div className="flex-1 space-y-3">
                        <div>
                            <p className="text-[11px] text-zinc-500">Current Temperature</p>
                            <p className="text-sm font-medium text-zinc-200">68.5°F • Room Ambient</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-zinc-500">Humidity & Quality</p>
                            <p className="text-sm font-medium text-emerald-300">48% • Excellent</p>
                        </div>
                    </div>
                </div>
            </GlossyCard>

            <div className="grid grid-cols-2 gap-4">
                <GlossyCard accent="blue" icon={Lightbulb} title="Main Lights" subtitle="On • 80%" />
                <GlossyCard accent="green" icon={Wind} title="Air Purifier" subtitle="Auto • Normal" />
                <GlossyCard accent="purple" icon={Music2} title="Media Center" subtitle="Dolby Atmos On" />
                <GlossyCard accent="violet" icon={ShieldCheck} title="Night Shield" subtitle="Armed" />
            </div>

            <div className="space-y-3">
                <SliderRow icon={Sun} label="Atmospheric Brightness" percent={80} />
                <SliderRow icon={Volume2} label="Surround Volume" percent={45} />
            </div>
        </BrokerPageFrame>
    );
}
